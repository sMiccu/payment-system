# blog/serializers.py
from rest_framework import serializers
from .models import Calculation

class CalculationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Calculation
        fields = ['id', 'amount']
