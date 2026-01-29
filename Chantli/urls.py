from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import PropiedadViewSet, ReservaViewSet, CurrentUserView, RegistroView, GoogleLoginView

router = DefaultRouter()
router.register(r'propiedades', PropiedadViewSet)
router.register(r'reservas', ReservaViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('me/', CurrentUserView.as_view(), name='current-user'),
    path('registro/', RegistroView.as_view(), name='registro'),
    path('google-login/', GoogleLoginView.as_view(), name='google-login'),
]