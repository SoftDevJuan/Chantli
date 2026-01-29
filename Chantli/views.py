from rest_framework import viewsets, permissions, status
from rest_framework.authtoken.models import Token
from rest_framework.decorators import action
from rest_framework.views import APIView
from rest_framework.response import Response
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests
from .models import *
from .serializers import *
from django.contrib.auth.models import User
from rest_framework.parsers import MultiPartParser, FormParser
from django.db.models import Q

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

    @action(detail=False, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def mis_propiedades(self, request):
        propiedades = Propiedad.objects.filter(anfitrion=request.user)
        serializer = self.get_serializer(propiedades, many=True)
        return Response(serializer.data)
    

# --- VISTA DE NOTIFICACIONES ---
class NotificacionViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = NotificacionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Notificacion.objects.filter(usuario=self.request.user).order_by('-fecha')

    @action(detail=True, methods=['patch'])
    def marcar_leida(self, request, pk=None):
        notificacion = self.get_object()
        notificacion.leida = True
        notificacion.save()
        return Response({'status': 'ok'})

# --- VISTA DE MENSAJES (CHAT) ---
class MensajeViewSet(viewsets.ModelViewSet):
    serializer_class = MensajeSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Esta vista es genérica, pero usaremos una acción para obtener la charla con X persona
        return Mensaje.objects.filter(Q(remitente=self.request.user) | Q(destinatario=self.request.user))

    @action(detail=False, methods=['get'], url_path='conversacion/(?P<user_id>\d+)')
    def conversacion(self, request, user_id=None):
        # Trae los mensajes entre YO y el USUARIO_ID
        mensajes = Mensaje.objects.filter(
            (Q(remitente=request.user) & Q(destinatario_id=user_id)) |
            (Q(remitente_id=user_id) & Q(destinatario=request.user))
        ).order_by('fecha')
        serializer = self.get_serializer(mensajes, many=True)
        return Response(serializer.data)


class ReservaViewSet(viewsets.ModelViewSet):
    queryset = Reserva.objects.all()
    serializer_class = ReservaSerializer
    permission_classes = [permissions.IsAuthenticated]

    # Endpoint para ver solicitudes recibidas: /api/reservas/solicitudes_recibidas/
    @action(detail=False, methods=['get'])
    def solicitudes_recibidas(self, request):
        # Buscamos reservas donde la propiedad pertenece al usuario actual
        reservas = Reserva.objects.filter(propiedad__anfitrion=request.user).order_by('-fecha_creacion')
        serializer = self.get_serializer(reservas, many=True)
        return Response(serializer.data)

    # Endpoint para aceptar/rechazar: PATCH /api/reservas/{id}/responder/


    def perform_create(self, serializer):
        reserva = serializer.save(huesped=self.request.user)
        # Crear notificación para el dueño
        dueño = reserva.propiedad.anfitrion
        Notificacion.objects.create(
            usuario=dueño,
            mensaje=f"Nueva solicitud de reserva para {reserva.propiedad.titulo}",
            reserva_id=reserva.id
        )

    # 2. Cuando el Dueño responde -> Notificar al Huésped
    @action(detail=True, methods=['patch'])
    def responder(self, request, pk=None):
        reserva = self.get_object()
        nuevo_estado = request.data.get('estado')
        
        if reserva.propiedad.anfitrion != request.user:
            return Response({'error': 'No autorizado'}, status=403)
            
        reserva.estado = nuevo_estado
        reserva.save()

        # Crear notificación para el huésped
        texto = f"Tu reserva en {reserva.propiedad.titulo} ha sido {nuevo_estado}."
        Notificacion.objects.create(
            usuario=reserva.huesped,
            mensaje=texto,
            reserva_id=reserva.id
        )

        return Response({'status': 'ok', 'estado': reserva.estado})
    


class CurrentUserView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    # 2. AGREGAR ESTA LÍNEA MÁGICA
    parser_classes = (MultiPartParser, FormParser) 

    def get(self, request):
        serializer = UserSerializer(request.user, context={'request': request})
        return Response(serializer.data)

    def patch(self, request):
        # Ya no necesitamos hacer copias ni bucles for.
        # Solo aseguramos pasar el contexto.
        
        serializer = UserUpdateSerializer(
            request.user, 
            data=request.data, 
            partial=True,
            context={'request': request} # <--- Esto es lo vital
        )

        if serializer.is_valid():
            serializer.save()
            read_serializer = UserSerializer(request.user, context={'request': request})
            return Response(read_serializer.data)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    

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
            CLIENT_ID = "485296325778-9i5j0efprjtgil4v66cr1p46rg18sjne.apps.googleusercontent.com" 
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