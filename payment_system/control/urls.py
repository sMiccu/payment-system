from django.urls import path, include, re_path
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView, SpectacularRedocView
from . import views
from rest_framework.routers import DefaultRouter

router = DefaultRouter()
router.register(r'store', views.StoreViewSet, basename='store')
router.register(r'daily_store_sales', views.DailyStoreSalesViewSet, basename='daily_store_sales')
router.register(r'duration_rate', views.DurationRateViewSet, basename='duration_rate')

urlpatterns = [
    path('', views.index, name='index'),
    path('api/', include(router.urls)),
    # APIViews should be mounted via path() instead of router.register
    # 末尾スラッシュ有無の両方を許容（POSTでも404にしないため）
    re_path(r'^api/login/?$', views.CookieTokenObtainPairView.as_view(), name='login'),
    re_path(r'^api/refresh/?$', views.CookieTokenRefreshView.as_view(), name='refresh'),
    re_path(r'^api/logout/?$', views.LogoutView.as_view(), name='logout'),
    # OpenAPI & Docs
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    path('api/redoc/', SpectacularRedocView.as_view(url_name='schema'), name='redoc'),
]
