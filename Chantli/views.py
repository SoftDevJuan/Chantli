from rest_framework import viewsets, permissions
from .models import Propiedad, Reserva, FotoPropiedad
from .serializers import PropiedadSerializer, ReservaSerializer

class PropiedadViewSet(viewsets.ModelViewSet):
    queryset = Propiedad.objects.all()
    serializer_class = PropiedadSerializer
    # Aquí luego agregaremos permisos (IsAuthenticated, etc.)

class ReservaViewSet(viewsets.ModelViewSet):
    queryset = Reserva.objects.all()
    serializer_class = ReservaSerializer

class PropiedadViewSet(viewsets.ModelViewSet):
    queryset = Propiedad.objects.all()
    serializer_class = PropiedadSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def perform_create(self, serializer):
        # 1. Guardamos la propiedad principal (con su título, precio, y foto de portada si la hay)
        propiedad = serializer.save(anfitrion=self.request.user)

        # 2. Buscamos si vienen fotos extra en la petición
        # 'fotos_extra' será la clave que usaremos en el Frontend
        imagenes_extra = self.request.FILES.getlist('fotos_extra')

        # 3. Creamos un objeto FotoPropiedad por cada imagen recibida
        for imagen in imagenes_extra:
            FotoPropiedad.objects.create(propiedad=propiedad, imagen=imagen)