# Create your views here.
from django.http import HttpResponse
from .models import Calculation
from .serializers import CalculationSerializer
from rest_framework import viewsets
from rest_framework.permissions import AllowAny

def index(request):
    return HttpResponse("Hello, world. You're at the polls index.")

class CalculationViewSet(viewsets.ModelViewSet):
    queryset = Calculation.objects.all()
    serializer_class = CalculationSerializer
    permission_classes = [AllowAny]
