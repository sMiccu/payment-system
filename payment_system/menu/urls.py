from django.urls import path, include
from . import views
from rest_framework.routers import DefaultRouter

router = DefaultRouter()
router.register(r'menu', views.MenuViewSet, basename='menu')
router.register(r'category', views.CategoryViewSet, basename='category')

urlpatterns = [
    path('', views.index, name='index'),
    path('api/', include(router.urls)),
]
