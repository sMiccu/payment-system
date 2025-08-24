# Create your views here.
from django.http import HttpResponse
from .models import Customer, CustomerBreak, Membership
from .serializers import CustomerSerializer, CustomerBreakSerializer, MembershipSerializer
from rest_framework import viewsets
from rest_framework.permissions import AllowAny

def index(request):
    return HttpResponse("Hello, world. You're at the polls index.")

class CustomerViewSet(viewsets.ModelViewSet):
    queryset = Customer.objects.all()
    serializer_class = CustomerSerializer
    permission_classes = [AllowAny]

class CustomerBreakViewSet(viewsets.ModelViewSet):
    queryset = CustomerBreak.objects.all()
    serializer_class = CustomerBreakSerializer
    permission_classes = [AllowAny]

class MembershipViewSet(viewsets.ModelViewSet):
    queryset = Membership.objects.all()
    serializer_class = MembershipSerializer
    permission_classes = [AllowAny]
