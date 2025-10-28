from django.urls import path, include
from . import views
from rest_framework.routers import DefaultRouter

router = DefaultRouter()
router.register(r'store', views.StoreViewSet, basename='store')
router.register(r'daily_store_sales', views.DailyStoreSalesViewSet, basename='daily_store_sales')
router.register(r'duration_rate', views.DurationRateViewSet, basename='duration_rate')
router.register(r'login', views.CookieTokenObtainPairView, basename='login')
router.register(r'refresh', views.CookieTokenRefreshView, basename='refresh')
router.register(r'logout', views.LogoutView, basename='logout')

urlpatterns = [
    path('', views.index, name='index'),
    path('api/', include(router.urls)),
]
