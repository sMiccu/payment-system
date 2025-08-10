from django.urls import include, path

from . import views

from rest_framework import routers

router = routers.DefaultRouter()
router.register(r'calculations', views.CalculationViewSet)

urlpatterns = [
    path("", views.index, name="index"),
    path("api/", include(router.urls)),
]
