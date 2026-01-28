from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import PropiedadViewSet, ReservaViewSet

router = DefaultRouter()
router.register(r'propiedades', PropiedadViewSet)
router.register(r'reservas', ReservaViewSet)

urlpatterns = [
    path('', include(router.urls)),
]