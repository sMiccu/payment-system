from django.shortcuts import render

# Create your views here.
from django.http import HttpResponse
from .models import Menu
from .serializers import MenuSerializer
from rest_framework import viewsets
from rest_framework.permissions import AllowAny

def index(request):
    return HttpResponse("Hello, world. You're at the polls index.")

class MenuViewSet(viewsets.ModelViewSet):
    queryset = Menu.objects.all()
    serializer_class = MenuSerializer
    permission_classes = [AllowAny]
