from django.urls import path, include
from . import views
from rest_framework.routers import DefaultRouter

router = DefaultRouter()
router.register(r'store', views.StoreViewSet, basename='store')

urlpatterns = [
    path('', views.index, name='index'),
    path('api/', include(router.urls)),
]
