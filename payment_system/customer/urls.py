from django.urls import path, include
from . import views
from rest_framework.routers import DefaultRouter

router = DefaultRouter()
router.register(r'customer', views.CustomerViewSet, basename='customer')
router.register(r'customer_break', views.CustomerBreakViewSet, basename='customer_break')
router.register(r'membership', views.MembershipViewSet, basename='membership')

urlpatterns = [
    path('', views.index, name='index'),
    path('api/', include(router.urls)),
]
