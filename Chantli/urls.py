from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import *

router = DefaultRouter()
router.register(r'propiedades', PropiedadViewSet)
router.register(r'reservas', ReservaViewSet)
router.register(r'notificaciones', NotificacionViewSet, basename='notificacion')
router.register(r'mensajes', MensajeViewSet, basename='mensaje')
router.register(r'tarjetas', TarjetaViewSet, basename='tarjeta')
router.register(r'pagos', PagoViewSet, basename='pago')

urlpatterns = [
    path('', include(router.urls)),
    path('me/', CurrentUserView.as_view(), name='current-user'),
    path('registro/', RegistroView.as_view(), name='registro'),
    path('google-login/', GoogleLoginView.as_view(), name='google-login'),
]
