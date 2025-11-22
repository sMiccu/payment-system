# Create your views here.
from django.http import HttpResponse
from .models import Customer, CustomerBreak, Membership
from .serializers import CustomerSerializer, CustomerBreakSerializer, MembershipSerializer
from rest_framework import viewsets
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import ValidationError
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from django.utils.dateparse import parse_datetime
from control.services.pricing.service import quote_amount, collect_breaks_for_customer
from order.models import Order, OrderItem
from django.db.models import Sum
from decimal import Decimal

def index(request):
    return HttpResponse("Hello, world. You're at the polls index.")

class CustomerViewSet(viewsets.ModelViewSet):
    serializer_class = CustomerSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated:
            return Customer.objects.none()
        return Customer.objects.filter(store=user.store)
    
    def perform_create(self, serializer):
        user = self.request.user
        if not getattr(user, "store", None):
            raise ValidationError("店舗が未設定のユーザーです。")
        serializer.save(store=user.store)
    
    @action(detail=True, methods=['post'])
    def pause(self, request, pk=None):
        customer = self.get_object()
        if CustomerBreak.objects.filter(customer=customer, end_datetime__isnull=True).exists():
            raise ValidationError("既に休止中です。")
        CustomerBreak.objects.create(customer=customer, start_datetime=timezone.now())
        return Response({"status": "paused"}, status=status.HTTP_200_OK)
    
    @action(detail=True, methods=['post'])
    def resume(self, request, pk=None):
        customer = self.get_object()
        active_break = CustomerBreak.objects.filter(customer=customer, end_datetime__isnull=True).order_by('-start_datetime').first()
        if not active_break:
            raise ValidationError("休止中ではありません。")
        active_break.end_datetime = timezone.now()
        active_break.save(update_fields=["end_datetime"])
        return Response({"status": "resumed"}, status=status.HTTP_200_OK)

    @action(detail=True, methods=['get'])
    def quote(self, request, pk=None):
        customer = self.get_object()
        user_store = getattr(request.user, "store", None)
        if not user_store:
            raise ValidationError("ユーザーに店舗が設定されていません。")
        if customer.store_id != user_store.id:
            raise ValidationError("顧客の属する店舗とユーザーの店舗が一致しません。")

        start_param = request.query_params.get("start_dt")
        end_param = request.query_params.get("end_dt")

        if start_param:
            start_dt = parse_datetime(start_param)
            if not start_dt:
                raise ValidationError("start_dt の形式が不正です。ISO 8601 で指定してください。")
        else:
            start_dt = customer.start_datetime

        if end_param:
            end_dt = parse_datetime(end_param)
            if not end_dt:
                raise ValidationError("end_dt の形式が不正です。ISO 8601 で指定してください。")
        else:
            end_dt = customer.end_datetime or timezone.now()

        if not start_dt:
            raise ValidationError("開始時刻が未設定です。顧客の start_datetime または start_dt を指定してください。")
        if end_dt <= start_dt:
            raise ValidationError("終了時刻は開始時刻より後である必要があります。")

        is_member = bool(customer.membership_id)
        breaks = collect_breaks_for_customer(customer=customer, start_dt=start_dt, end_dt=end_dt)
        result = quote_amount(
            store=user_store,
            is_member=is_member,
            start_dt=start_dt,
            end_dt=end_dt,
            breaks=breaks,
        )
        # Decimal を文字列化して返す
        def serialize_break(b):
            return {
                "minutes": str(b["minutes"]),
                "count": b["count"],
                "unit_price": str(b["unit_price"]),
                "line_total": str(b["line_total"]),
            }
        data = {
            "played_minutes": str(result.played_minutes),
            "subtotal": str(result.subtotal),
            "breakdown": [serialize_break(b) for b in result.breakdown],
        }
        return Response(data, status=status.HTTP_200_OK)

    @action(detail=False, methods=['get', 'post'], url_path='payment')
    def payment(self, request):
        """
        GET: 注文内訳と注文合計を返す。?customer_id=...
        POST: 会計確定。{ customer_id, payment_method: 'cash'|'paypay' }
        """
        user_store = getattr(request.user, "store", None)
        if not user_store:
            raise ValidationError("ユーザーに店舗が設定されていません。")

        if request.method.lower() == 'get':
            customer_id = request.query_params.get("customer_id")
            if not customer_id:
                raise ValidationError("customer_id は必須です。")
            try:
                customer = Customer.objects.get(pk=customer_id, store=user_store)
            except Customer.DoesNotExist:
                raise ValidationError("指定した顧客が存在しません。")

            # 注文内訳をメニュー単位で集計
            items_qs = (OrderItem.objects
                        .filter(order__customer=customer)
                        .values('menu_id', 'menu__name')
                        .annotate(quantity=Sum('quantity'), line_total=Sum('subtotal'))
                        .order_by('menu_id'))
            items = [
                {
                    "menu_id": row["menu_id"],
                    "menu_name": row["menu__name"],
                    "quantity": row["quantity"],
                    "line_total": str(row["line_total"]),
                }
                for row in items_qs
            ]
            order_total = items_qs.aggregate(total=Sum('line_total'))["total"] or Decimal('0')
            return Response(
                {
                    "items": items,
                    "order_total": str(order_total),
                },
                status=status.HTTP_200_OK,
            )

        # POST: 会計確定
        customer_id = request.data.get("customer_id")
        payment_method = request.data.get("payment_method")
        if not customer_id:
            raise ValidationError({"customer_id": "必須項目です。"})
        if payment_method not in ("cash", "paypay"):
            raise ValidationError({"payment_method": "現金(cash) または PayPay(paypay) を指定してください。"})
        try:
            customer = Customer.objects.get(pk=customer_id, store=user_store)
        except Customer.DoesNotExist:
            raise ValidationError({"customer_id": "指定した顧客が存在しません。"})

        # 見積（プレイ料金）
        start_dt = customer.start_datetime
        end_dt = customer.end_datetime or timezone.now()
        if not start_dt or end_dt <= start_dt:
            raise ValidationError("会計に必要な滞在時間が不正です。")
        is_member = bool(customer.membership_id)
        breaks = collect_breaks_for_customer(customer=customer, start_dt=start_dt, end_dt=end_dt)
        quote = quote_amount(store=user_store, is_member=is_member, start_dt=start_dt, end_dt=end_dt, breaks=breaks)
        time_subtotal = quote.subtotal

        # 注文合計
        order_total = (Order.objects
                       .filter(customer=customer)
                       .aggregate(total=Sum('total_amount'))["total"] or Decimal('0'))

        total_amount = (Decimal(time_subtotal) + Decimal(order_total))
        # 顧客を会計済みに更新
        customer.total_amount = total_amount
        customer.paid = True
        customer.end_datetime = end_dt
        customer.save(update_fields=["total_amount", "paid", "end_datetime"])

        return Response(
            {
                "status": "ok",
                "payment_method": payment_method,
                "time_subtotal": str(time_subtotal),
                "order_total": str(order_total),
                "total_amount": str(total_amount),
            },
            status=status.HTTP_200_OK,
        )

class CustomerBreakViewSet(viewsets.ModelViewSet):
    serializer_class = CustomerBreakSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated:
            return CustomerBreak.objects.none()
        queryset = CustomerBreak.objects.filter(customer__store=user.store)
        customer_id = self.request.query_params.get('customer')
        if customer_id:
            queryset = queryset.filter(customer_id=customer_id)
        return queryset.order_by('start_datetime')

class MembershipViewSet(viewsets.ModelViewSet):
    serializer_class = MembershipSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated:
            return Membership.objects.none()
        queryset = Membership.objects.filter(store=user.store)
        phone_number = self.request.query_params.get('phone_number')
        if phone_number:
            queryset = queryset.filter(phone_number=phone_number)
        return queryset
    
    def perform_create(self, serializer):
        user = self.request.user
        if not getattr(user, "store", None):
            raise ValidationError("店舗が未設定のユーザーです。")
        serializer.save(store=user.store)
