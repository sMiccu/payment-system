from django.shortcuts import render

# Create your views here.
from django.http import HttpResponse
from .models import Order, OrderItem
from .serializers import OrderSerializer, OrderItemSerializer, OrderCreateSerializer
from rest_framework import viewsets, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError
from django.db import transaction
from decimal import Decimal


def index(request):
    return HttpResponse("Hello, world. You're at the polls index.")


class OrderViewSet(viewsets.ModelViewSet):
    """
    注文作成・履歴取得・複数明細キャンセルを扱うViewSet
    """
    serializer_class = OrderSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated:
            return Order.objects.none()
        store = getattr(user, "store", None)
        qs = Order.objects.all()
        if store is not None:
            qs = qs.filter(customer__store=store)
        customer_id = self.request.query_params.get("customer_id")
        if customer_id:
            qs = qs.filter(customer_id=customer_id)
        return qs.order_by("created_at")

    def create(self, request, *args, **kwargs):
        """
        通常の注文作成（正の数量の注文）
        """
        serializer = OrderCreateSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        order = serializer.save()
        return Response(
            {"order_id": order.id, "total_amount": str(order.total_amount)},
            status=status.HTTP_201_CREATED,
        )

    @action(detail=True, methods=["post"], url_path="cancel-items")
    def cancel_items(self, request, pk=None):
        """
        指定した注文の複数明細をまとめてキャンセルする。

        Request body:
        {
          "items": [
            { "order_item_id": int, "cancel_quantity": int },
            ...
          ]
        }

        キャンセル専用のOrderを1件だけ作成し、その中に負数quantityのOrderItemをぶら下げる。
        """
        order = self.get_object()
        user_store = getattr(request.user, "store", None)
        if not user_store or order.customer.store_id != user_store.id:
            raise ValidationError("この注文に対する操作が許可されていません。")

        items_data = request.data.get("items") or []
        if not isinstance(items_data, list) or not items_data:
            raise ValidationError({"items": "少なくとも1件の明細を指定してください。"})

        item_ids = [entry.get("order_item_id") for entry in items_data]
        if any(i is None for i in item_ids):
            raise ValidationError({"items": "order_item_id は必須です。"})

        order_items_qs = OrderItem.objects.filter(order=order, id__in=item_ids)
        order_items_map = {oi.id: oi for oi in order_items_qs}
        if len(order_items_map) != len(item_ids):
            raise ValidationError({"items": "指定された明細の一部が存在しないか、この注文に属していません。"})

        with transaction.atomic():
            cancel_order = Order.objects.create(customer=order.customer, total_amount=Decimal("0"))
            total = Decimal("0")

            for entry in items_data:
                oi_id = entry.get("order_item_id")
                cancel_qty = entry.get("cancel_quantity")
                if cancel_qty is None:
                    raise ValidationError({"cancel_quantity": "cancel_quantity は必須です。"})
                try:
                    cancel_qty = int(cancel_qty)
                except (TypeError, ValueError):
                    raise ValidationError({"cancel_quantity": "cancel_quantity は整数で指定してください。"})
                if cancel_qty <= 0:
                    raise ValidationError({"cancel_quantity": "キャンセル数量は1以上で指定してください。"})

                oi = order_items_map[oi_id]
                if cancel_qty > oi.quantity:
                    raise ValidationError(
                        {"cancel_quantity": f"注文済み数量({oi.quantity})を超えてキャンセルすることはできません。"}
                    )

                unit_price = Decimal(oi.menu.price)
                quantity = -cancel_qty
                line_total = unit_price * quantity
                OrderItem.objects.create(
                    order=cancel_order,
                    menu=oi.menu,
                    quantity=quantity,
                    subtotal=line_total,
                )
                total += line_total

            cancel_order.total_amount = total
            cancel_order.save(update_fields=["total_amount"])

        serializer = self.get_serializer(cancel_order)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class OrderItemViewSet(viewsets.ModelViewSet):
    queryset = OrderItem.objects.all()
    serializer_class = OrderItemSerializer
