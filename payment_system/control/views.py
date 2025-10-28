from django.shortcuts import render

# Create your views here.
from django.http import HttpResponse
from .models import DailyStoreSales, DurationRate, Store
from .serializers import DailyStoreSalesSerializer, DurationRateSerializer, StoreSerializer
from rest_framework import viewsets, status
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from django.conf import settings
from .serializers import CustomTokenObtainPairSerializer

COOKIE_ACCESS_NAME = 'access'
COOKIE_REFRESH_NAME = 'refresh'
SECURE = not settings.DEBUG
SAMESITE = 'Lax'  # 本番で別ドメインなら 'None' + SECURE=True

def index(request):
    return HttpResponse("Hello, world. You're at the polls index.")

def set_jwt_cookies(response, access, refresh=None):
    response.set_cookie(
        COOKIE_ACCESS_NAME, access,
        httponly=True, secure=SECURE, samesite=SAMESITE, max_age=60*15
    )
    if refresh:
        response.set_cookie(
            COOKIE_REFRESH_NAME, refresh,
            httponly=True, secure=SECURE, samesite=SAMESITE, max_age=60*30
        )

def clear_jwt_cookies(response):
    response.delete_cookie(COOKIE_ACCESS_NAME, samesite=SAMESITE)
    response.delete_cookie(COOKIE_REFRESH_NAME, samesite=SAMESITE)

class StoreViewSet(viewsets.ModelViewSet):
    queryset = Store.objects.all()
    serializer_class = StoreSerializer

class DailyStoreSalesViewSet(viewsets.ModelViewSet):
    queryset = DailyStoreSales.objects.all()
    serializer_class = DailyStoreSalesSerializer

class DurationRateViewSet(viewsets.ModelViewSet):
    queryset = DurationRate.objects.all()
    serializer_class = DurationRateSerializer

class CookieTokenObtainPairView(TokenObtainPairView):
    # permission_classes = [AllowAny]
    def post(self, request, *args, **kwargs):
        res = super().post(request,*args, **kwargs)  # bodyにaccess/refreshが入る
        data = res.data
        access = data.get('access')
        refresh = data.get('refresh')
        response = Response(status=status.HTTP_200_OK)
        set_jwt_cookies(response, access, refresh)
        # 必要ならボディからトークンを消す
        response.data = {'detail': 'ok'}
        return response
    
class CookieTokenRefreshView(TokenRefreshView):
    # permission_classes = [AllowAny]
    def post(self, request, *args, **kwargs):
        # Cookieからrefreshを補完
        if 'refresh' not in request.data:
            request.data['refresh'] = request.COOKIES.get(COOKIE_REFRESH_NAME)
        res = super().post(request,*args, **kwargs)
        access = res.data.get('access')
        refresh = res.data.get('refresh')  # ROTATE_REFRESH_TOKENS=True のとき新しいrefresh
        response = Response(status=status.HTTP_200_OK)
        set_jwt_cookies(response, access, refresh)
        response.data = {'detail': 'ok'}
        return response

class LogoutView(APIView):
    permission_classes = [IsAuthenticated]
    def post(self, request):
        refresh = request.COOKIES.get(COOKIE_REFRESH_NAME)
        if refresh:
            try:
                token = RefreshToken(refresh)
                token.blacklist()
            except Exception:
                pass
        response = Response(status=status.HTTP_204_NO_CONTENT)
        clear_jwt_cookies(response)
        return response
