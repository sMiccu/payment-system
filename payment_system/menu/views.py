from django.shortcuts import render

# Create your views here.
from django.http import HttpResponse
from .models import Menu, Category
from .serializers import MenuSerializer, CategorySerializer
from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import ValidationError

def index(request):
    return HttpResponse("Hello, world. You're at the polls index.")

class MenuViewSet(viewsets.ModelViewSet):
    serializer_class = MenuSerializer

    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated:
            return Menu.objects.none()
        return Menu.objects.filter(store=user.store)

    def perform_create(self, serializer):
        user = self.request.user
        store = getattr(user, "store", None)
        if not store:
            raise ValidationError("ユーザーに店舗が設定されていません。")
        serializer.save(store=store)

class CategoryViewSet(viewsets.ModelViewSet):
    serializer_class = CategorySerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated:
            return Category.objects.none()
        return Category.objects.filter(store=user.store).order_by('id')

    def perform_create(self, serializer):
        user = self.request.user
        store = getattr(user, "store", None)
        if not store:
            raise ValidationError("ユーザーに店舗が設定されていません。")
        serializer.save(store=store)
