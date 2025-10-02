# blog/serializers.py
from rest_framework import serializers
from .models import DailyStoreSales, DurationRate, Store

class StoreSerializer(serializers.ModelSerializer):
    class Meta:
        model = Store
        fields = ['id', 'name']

class DailyStoreSalesSerializer(serializers.ModelSerializer):
    class Meta:
        model = DailyStoreSales
        fields = ['date', 'store', 'cash_sales', 'paypay_sales', 'total_sales']

class DurationRateSerializer(serializers.ModelSerializer):
    class Meta:
        model = DurationRate
        fields = ['id', 'store', 'minutes', 'membership_price', 'general_price']
