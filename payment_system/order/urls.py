from django.urls import path, include
from . import views
from rest_framework.routers import DefaultRouter

router = DefaultRouter()
router.register(r'order', views.OrderViewSet, basename='order')
router.register(r'order_item', views.OrderItemViewSet, basename='order_item')

urlpatterns = [
    path('', views.index, name='index'),
    path('api/', include(router.urls)),
]
