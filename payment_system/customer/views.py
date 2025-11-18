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

class CustomerBreakViewSet(viewsets.ModelViewSet):
    serializer_class = CustomerBreakSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated:
            return CustomerBreak.objects.none()
        return CustomerBreak.objects.filter(customer__store=user.store)

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
