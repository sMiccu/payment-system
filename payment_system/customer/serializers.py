# blog/serializers.py
from rest_framework import serializers
from .models import Customer, CustomerBreak, Membership

class CustomerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Customer
        fields = ['id', 'name', 'membership', 'start_datetime', 'end_datetime']

class CustomerBreakSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomerBreak
        fields = ['id', 'customer', 'start_datetime', 'end_datetime']

class MembershipSerializer(serializers.ModelSerializer):
    class Meta:
        model = Membership
        fields = ['id', 'first_name', 'last_name']
