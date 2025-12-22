# blog/serializers.py
from rest_framework import serializers
from .models import Customer, CustomerBreak, Membership

class CustomerSerializer(serializers.ModelSerializer):
    is_breaking = serializers.SerializerMethodField()
    
    class Meta:
        model = Customer
        fields = ['id', 'name', 'store', 'membership', 'start_datetime', 'end_datetime', 'total_amount', 'paid', 'is_breaking']
        read_only_fields = ['store']
    
    def get_is_breaking(self, obj):
        return CustomerBreak.objects.filter(customer=obj, end_datetime__isnull=True).exists()

class CustomerBreakSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomerBreak
        fields = ['id', 'customer', 'start_datetime', 'end_datetime']

class MembershipSerializer(serializers.ModelSerializer):
    is_expired = serializers.SerializerMethodField()
    
    class Meta:
        model = Membership
        fields = ['id', 'store', 'first_name', 'last_name', 'first_name_kana', 'last_name_kana', 'phone_number', 'register_date', 'is_expired']
        read_only_fields = ['store']
    
    def get_is_expired(self, obj):
        if not obj.register_date or not obj.store or not obj.store.membership_validity_period:
            return False
        from datetime import date, timedelta
        expiry_date = obj.register_date + timedelta(days=obj.store.membership_validity_period)
        return date.today() > expiry_date
