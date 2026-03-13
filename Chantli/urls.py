from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import *

router = DefaultRouter()
router.register(r'propiedades', PropiedadViewSet)
router.register(r'reservas', ReservaViewSet, basename='reserva')
router.register(r'notificaciones', NotificacionViewSet, basename='notificacion')
router.register(r'mensajes', MensajeViewSet, basename='mensaje')
router.register(r'tarjetas', TarjetaViewSet, basename='tarjeta')
router.register(r'pagos', PagoViewSet, basename='pago')
router.register(r'perfil', PerfilUsuarioViewSet, basename='perfil')
router.register(r'resenas-usuario', ResenaUsuarioViewSet)
router.register(r'resenas', ResenaViewSet, basename='resena')
router.register(r'favoritos', FavoritoViewSet, basename='favoritos')



urlpatterns = [
    path('', include(router.urls)),
    path('me/', CurrentUserView.as_view(), name='current-user'),
    path('registro/', RegistroView.as_view(), name='registro'),
    path('google-login/', GoogleLoginView.as_view(), name='google-login'),
    path('public-profile/<int:pk>/', PublicUserProfileView.as_view()),
    path('webpush/subscribe/', SubscribePushView.as_view(), name='webpush-subscribe'),
    path('webpush/unsubscribe/', UnsubscribePushView.as_view(), name='webpush-unsubscribe'),
    path('admin-stats/', AdminDashboardStatsView.as_view(), name='admin-stats'),
]
