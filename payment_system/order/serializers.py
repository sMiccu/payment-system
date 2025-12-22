# blog/serializers.py
from rest_framework import serializers
from .models import Order, OrderItem
from customer.models import Customer
from menu.models import Menu
from django.db import transaction
from decimal import Decimal


class OrderItemSerializer(serializers.ModelSerializer):
    """
    注文履歴表示用の明細シリアライザ
    """
    # モデル上に menu_id フィールドが自動で存在するため source 指定は不要
    menu_id = serializers.IntegerField(read_only=True)
    menu_name = serializers.CharField(source='menu.name', read_only=True)
    menu_price = serializers.IntegerField(source='menu.price', read_only=True)

    class Meta:
        model = OrderItem
        fields = [
            'id',
            'order',
            'menu',
            'menu_id',
            'menu_name',
            'menu_price',
            'quantity',
            'subtotal',
        ]


class OrderSerializer(serializers.ModelSerializer):
    """
    注文履歴用の注文シリアライザ
    """
    items = OrderItemSerializer(source='orderitem', many=True, read_only=True)

    class Meta:
        model = Order
        fields = ['id', 'customer', 'total_amount', 'created_at', 'items']

class OrderCreateItemSerializer(serializers.Serializer):
    menu_id = serializers.IntegerField()
    quantity = serializers.IntegerField(min_value=1)

class OrderCreateSerializer(serializers.Serializer):
    customer_id = serializers.IntegerField(required=False, allow_null=True)
    items = OrderCreateItemSerializer(many=True)

    def validate(self, attrs):
        items = attrs.get('items') or []
        if not items:
            raise serializers.ValidationError({"items": "少なくとも1件の商品が必要です。"})
        return attrs

    def create(self, validated_data):
        request = self.context.get('request')
        user = getattr(request, 'user', None) if request else None
        store = getattr(user, 'store', None)
        if not store:
            raise serializers.ValidationError({"store": "ユーザーに店舗が設定されていません。"})

        customer_id = validated_data.get('customer_id')
        customer = None
        if customer_id is not None:
            try:
                customer = Customer.objects.get(pk=customer_id, store=store)
            except Customer.DoesNotExist:
                raise serializers.ValidationError({"customer_id": "指定した顧客が存在しません。"})
        else:
            # Orderモデルがcustomer必須のため、未指定はエラー
            raise serializers.ValidationError({"customer_id": "customer_id は必須です。"})

        order_items_data = validated_data['items']

        with transaction.atomic():
            order = Order.objects.create(customer=customer, total_amount=Decimal('0'))

            bulk_items = []
            total = Decimal('0')
            for item in order_items_data:
                try:
                    menu = Menu.objects.get(pk=item['menu_id'], store=store)
                except Menu.DoesNotExist:
                    raise serializers.ValidationError({"items": f"menu_id={item['menu_id']} が存在しません。"})
                quantity = item['quantity']
                unit_price = Decimal(menu.price)
                line_total = unit_price * quantity
                total += line_total
                bulk_items.append(OrderItem(order=order, menu=menu, quantity=quantity, subtotal=line_total))

            OrderItem.objects.bulk_create(bulk_items)
            order.total_amount = total
            order.save(update_fields=['total_amount'])

        return order
