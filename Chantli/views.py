from rest_framework import viewsets, permissions, status
from rest_framework.authtoken.models import Token
from rest_framework.views import APIView
from rest_framework.response import Response
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests
from .models import Propiedad, Reserva, FotoPropiedad
from .serializers import *
from django.contrib.auth.models import User

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

class CurrentUserView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data)
    

class RegistroView(APIView):
    def post(self, request):
        serializer = RegistroSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            # Generamos el token inmediatamente para que ya quede logueado
            token, created = Token.objects.get_or_create(user=user)
            return Response({
                'token': token.key,
                'user_id': user.pk,
                'email': user.email
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

# B. LOGIN/REGISTRO CON GOOGLE
class GoogleLoginView(APIView):
    def post(self, request):
        token_google = request.data.get('token')
        rol_seleccionado = request.data.get('rol', 'huesped') # Por defecto huesped si no especifican

        try:
            # 1. Validar el token con los servidores de Google
            # (Reemplaza 'TU_CLIENT_ID' con el ID que te da Google Cloud Console)
            CLIENT_ID = "TU_CLIENT_ID_DE_GOOGLE.apps.googleusercontent.com" 
            idinfo = id_token.verify_oauth2_token(token_google, google_requests.Request(), CLIENT_ID)

            email = idinfo['email']
            username = email.split('@')[0] # Usamos la parte antes del @ como usuario

            # 2. Verificar si el usuario ya existe
            try:
                user = User.objects.get(email=email)
            except User.DoesNotExist:
                # 3. Si no existe, lo CREAMOS automágicamente
                user = User.objects.create_user(username=username, email=email)
                user.set_unusable_password() # No tendrá contraseña porque entra con Google
                user.save()
                # Creamos su perfil
                PerfilUsuario.objects.create(usuario=user, rol=rol_seleccionado)

            # 4. Generar Token de Django
            token, created = Token.objects.get_or_create(user=user)
            
            return Response({'token': token.key, 'username': user.username})

        except ValueError:
            return Response({'error': 'Token de Google inválido'}, status=status.HTTP_400_BAD_REQUEST)