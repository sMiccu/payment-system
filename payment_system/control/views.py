from django.shortcuts import render

# Create your views here.
from django.http import HttpResponse
from .models import DailyStoreSales, DurationRate, Store
from .serializers import DailyStoreSalesSerializer, DurationRateSerializer, StoreSerializer
from rest_framework import viewsets
from rest_framework.permissions import AllowAny
from rest_framework_simplejwt.views import TokenObtainPairView
from .serializers import CustomTokenObtainPairSerializer

def index(request):
    return HttpResponse("Hello, world. You're at the polls index.")

class StoreViewSet(viewsets.ModelViewSet):
    queryset = Store.objects.all()
    serializer_class = StoreSerializer
    permission_classes = [AllowAny]

class DailyStoreSalesViewSet(viewsets.ModelViewSet):
    queryset = DailyStoreSales.objects.all()
    serializer_class = DailyStoreSalesSerializer
    permission_classes = [AllowAny]

class DurationRateViewSet(viewsets.ModelViewSet):
    queryset = DurationRate.objects.all()
    serializer_class = DurationRateSerializer
    permission_classes = [AllowAny]

class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer
