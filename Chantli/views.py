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
from django.db import transaction
from decimal import Decimal
import datetime
import io
from django.template.loader import render_to_string
from django.core.mail import EmailMessage
from django.core.files.base import ContentFile
from xhtml2pdf import pisa
from django.conf import settings


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
    
    @action(detail=True, methods=['get'])
    def fechas_ocupadas(self, request, pk=None):
        propiedad = self.get_object()
        # Buscamos reservas futuras que estén aceptadas o pagadas
        ocupaciones = Reserva.objects.filter(
            propiedad=propiedad,
            estado__in=['aceptada', 'pagada'],
            fecha_fin__gte=datetime.date.today()
        )
        
        data = []
        for o in ocupaciones:
            data.append({
                'inicio': o.fecha_inicio,
                'fin': o.fecha_fin
            })
        return Response(data)
    

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
        return Mensaje.objects.filter(Q(remitente=self.request.user) | Q(destinatario=self.request.user))

    def perform_create(self, serializer):
        serializer.save(remitente=self.request.user)

    # --- 1. Obtener conteo de NO LEÍDOS ---
    @action(detail=False, methods=['get'])
    def unread_count(self, request):
        count = Mensaje.objects.filter(destinatario=request.user, leido=False).count()
        return Response({'count': count})

    # --- 2. Info pública de un usuario (para el Header del chat) ---
    @action(detail=False, methods=['get'], url_path='user_info/(?P<user_id>\d+)')
    def user_info(self, request, user_id=None):
        try:
            target_user = User.objects.get(id=user_id)
            foto_url = None
            try:
                if target_user.perfil.foto_perfil:
                    foto_url = request.build_absolute_uri(target_user.perfil.foto_perfil.url)
            except:
                pass
            
            data = {
                'id': target_user.id,
                'nombre': f"{target_user.first_name} {target_user.last_name}".strip() or target_user.username,
                'foto': foto_url
            }
            return Response(data)
        except User.DoesNotExist:
            return Response({'error': 'Usuario no encontrado'}, status=404)

    # --- 3. Actualizar Conversación (Marcar como leídos al abrir) ---
    @action(detail=False, methods=['get'], url_path='conversacion/(?P<user_id>\d+)')
    def conversacion(self, request, user_id=None):
        # A. Marcar como leídos los mensajes que ME enviaron a MÍ en esta charla
        Mensaje.objects.filter(
            remitente_id=user_id, 
            destinatario=request.user, 
            leido=False
        ).update(leido=True)

        # B. Traer los mensajes
        mensajes = Mensaje.objects.filter(
            (Q(remitente=request.user) & Q(destinatario_id=user_id)) |
            (Q(remitente_id=user_id) & Q(destinatario=request.user))
        ).order_by('fecha')
        
        serializer = self.get_serializer(mensajes, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def inbox(self, request):
        user = request.user
        # 1. Traer todos los mensajes donde soy remitente O destinatario
        mensajes = Mensaje.objects.filter(
            Q(remitente=user) | Q(destinatario=user)
        ).select_related('remitente__perfil', 'destinatario__perfil').order_by('-fecha')

        conversaciones = {}
        
        for msg in mensajes:
            # Identificar quién es la "otra persona"
            otro_usuario = msg.destinatario if msg.remitente == user else msg.remitente
            
            # Si ya guardamos la conversación con este usuario, saltamos (porque ya tenemos el más reciente)
            if otro_usuario.id not in conversaciones:
                # Datos básicos para mostrar en la lista
                foto_url = None
                try:
                    if otro_usuario.perfil.foto_perfil:
                        foto_url = request.build_absolute_uri(otro_usuario.perfil.foto_perfil.url)
                except:
                    pass

                conversaciones[otro_usuario.id] = {
                    'usuario_id': otro_usuario.id,
                    'nombre': f"{otro_usuario.first_name} {otro_usuario.last_name}".strip() or otro_usuario.username,
                    'foto': foto_url,
                    'ultimo_mensaje': msg.contenido,
                    'fecha': msg.fecha,
                    'es_mio': msg.remitente == user # Para saber si dice "Tú: Hola"
                }

        return Response(conversaciones.values())







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
        nuevo_estado = request.data.get('estado') # 'esperando_pago' o 'rechazada'
        
        if reserva.propiedad.anfitrion != request.user:
            return Response({'error': 'No autorizado'}, status=403)
        
        reserva.estado = nuevo_estado
        reserva.save()
        
        # Notificar al huésped
        if nuevo_estado == 'esperando_pago':
            Notificacion.objects.create(
                usuario=reserva.huesped,
                mensaje=f"¡Tu solicitud en {reserva.propiedad.titulo} fue ACEPTADA! Realiza el pago para confirmar.",
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
        
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from decimal import Decimal
import io
from django.template.loader import render_to_string
from django.core.mail import EmailMessage
from django.core.files.base import ContentFile
from xhtml2pdf import pisa
from django.conf import settings

# Asegúrate de importar tus modelos y el serializer
from .models import Pago, Reserva, Tarjeta
from .serializers import PagoSerializer

class PagoViewSet(viewsets.ModelViewSet):  # <--- CAMBIO IMPORTANTE: ModelViewSet
    serializer_class = PagoSerializer
    permission_classes = [permissions.IsAuthenticated]

    # Esto soluciona el error 404 al entrar a /api/pagos/
    def get_queryset(self):
        """Devuelve solo los pagos del usuario logueado, ordenados por fecha."""
        return Pago.objects.filter(pagador=self.request.user).order_by('-fecha_pago')

    @action(detail=False, methods=['post'])
    def procesar(self, request):
        reserva_id = request.data.get('reserva_id')
        tarjeta_id = request.data.get('tarjeta_id')

        print(f"\n--- INICIO PROCESO DE PAGO AVANZADO ---")

        try:
            # 1. VALIDACIÓN ANTI-DUPLICADOS
            if Pago.objects.filter(reserva_id=reserva_id).exists():
                return Response({'error': 'Esta reserva ya ha sido pagada previamente.'}, status=400)

            # 2. OBTENER OBJETOS
            reserva = Reserva.objects.get(id=reserva_id)
            guest_card = Tarjeta.objects.get(id=tarjeta_id, usuario=request.user)
            
            # --- NUEVO: Validar Disponibilidad de Fechas ---
            # Buscamos si hay OTRA reserva pagada/aceptada que choque con estas fechas en la misma propiedad
            choques = Reserva.objects.filter(
                propiedad=reserva.propiedad,
                estado__in=['pagada', 'aceptada'], # Solo nos importan las confirmadas
                fecha_inicio__lt=reserva.fecha_fin,
                fecha_fin__gt=reserva.fecha_inicio
            ).exclude(id=reserva.id) # Nos excluimos a nosotros mismos

            if choques.exists():
                return Response({'error': 'Las fechas seleccionadas ya no están disponibles. Alguien ganó la reserva.'}, status=400)

            # 3. CÁLCULO DE TIEMPO Y COSTOS (PRORRATEO)
            # Calculamos cuántos días se va a quedar
            dias_totales = (reserva.fecha_fin - reserva.fecha_inicio).days
            
            # Validación mínima de días (ej. mínimo 1 día)
            if dias_totales < 1: dias_totales = 1

            precio_mensual = Decimal(str(reserva.propiedad.precio))
            precio_diario = precio_mensual / Decimal('30') # Estandarizamos mes de 30 días
            
            # Renta Exacta por los días seleccionados
            renta_calculada = precio_diario * Decimal(dias_totales)
            
            # Depósito: Usualmente se cobra 1 mes completo de garantía, independientemente de los días
            deposito = precio_mensual 
            
            # IVA (16% sobre la renta de esos días)
            impuesto = renta_calculada * Decimal('0.16')
            
            # Total Final
            total_a_cobrar = renta_calculada + deposito + impuesto

            # 4. VALIDAR FONDOS HUÉSPED
            if guest_card.saldo < total_a_cobrar:
                return Response({'error': f'Fondos insuficientes. Total a pagar: ${total_a_cobrar:,.2f}'}, status=400)

            # --- LOGÍSTICA DE DISPERSIÓN DE PAGOS (LA MAGIA) ---
            
            # A) Buscar la cuenta del ADMIN (Donde cae todo primero)
            # Asumimos que el primer superusuario es el dueño de la App
            from django.contrib.auth.models import User
            admin_user = User.objects.filter(is_superuser=True).first()
            if not admin_user:
                return Response({'error': 'Configuración crítica: No existe usuario Administrador para recibir fondos.'}, status=500)
            
            # Buscamos tarjeta del Admin (debe tener una creada en el sistema para recibir)
            admin_card = Tarjeta.objects.filter(usuario=admin_user).first()
            if not admin_card:
                return Response({'error': 'El Administrador no tiene una cuenta configurada para recibir pagos.'}, status=500)

            # B) Buscar la cuenta del ANFITRION (Dueño de la casa)
            host_user = reserva.propiedad.propietario
            host_card = Tarjeta.objects.filter(usuario=host_user).first()
            if not host_card:
                return Response({'error': f'El anfitrión {host_user.first_name} no ha registrado una cuenta para recibir su dinero.'}, status=400)

            # 5. EJECUTAR TRANSACCIONES
            
            # PASO A: Cobrar al Huésped
            guest_card.saldo -= total_a_cobrar
            guest_card.save()

            # PASO B: Todo el dinero cae al Admin
            admin_card.saldo += total_a_cobrar
            admin_card.save()

            # PASO C: Calcular la parte del Anfitrión
            # La app se queda con el 5% de la RENTA (no del depósito ni impuestos, eso se suele pasar íntegro o depende de tu contabilidad)
            # Aquí asumiremos:
            # Anfitrión recibe: (Renta - 5%) + Depósito + Impuestos (para que él los declare)
            comision_app = renta_calculada * Decimal('0.05')
            ganancia_anfitrion = total_a_cobrar - comision_app

            # PASO D: Transferir del Admin al Anfitrión
            if admin_card.saldo >= ganancia_anfitrion:
                admin_card.saldo -= ganancia_anfitrion
                host_card.saldo += ganancia_anfitrion
                
                admin_card.save()
                host_card.save()
            else:
                # Esto no debería pasar matemáticamente, pero por seguridad
                print("⚠️ Error Crítico: La cuenta admin no tiene fondos tras recibir el pago.")

            # 6. CREAR REGISTRO DE PAGO
            pago = Pago.objects.create(
                reserva=reserva,
                pagador=request.user,
                monto_renta=renta_calculada, # Guardamos el exacto calculado
                monto_deposito=deposito,
                comision_app=comision_app,
                ganancia_anfitrion=ganancia_anfitrion,
                total_pagado=total_a_cobrar
            )

            reserva.estado = 'pagada'
            reserva.save()

            # 7. GENERACIÓN DE PDF Y CORREO (Tu código existente aquí)
            try:
                context = {
                    'pago': pago, 
                    'impuesto': impuesto, 
                    'dias': dias_totales, # Enviamos días al recibo
                    'precio_diario': precio_diario
                }
                html_string = render_to_string('recibo_pago.html', context)
                pdf_file = io.BytesIO()
                pisa_status = pisa.CreatePDF(io.BytesIO(html_string.encode("UTF-8")), dest=pdf_file)
                
                if not pisa_status.err:
                    filename = f"recibo_chantli_{pago.id}.pdf"
                    pago.pdf_factura.save(filename, ContentFile(pdf_file.getvalue()))
                    pago.save()
                    
                    # Email logic...
                    email = EmailMessage(
                        f'Tu Recibo - Reserva #{reserva.id}',
                        f'Pago confirmado por {dias_totales} días.',
                        settings.EMAIL_HOST_USER,
                        [request.user.email],
                    )
                    email.attach(filename, pdf_file.getvalue(), 'application/pdf')
                    email.send()
            except Exception as e:
                print(f"⚠️ Error PDF: {e}")

            # 8. RESPUESTA
            factura_texto = (
                f"Días: {dias_totales}\n"
                f"Renta ({dias_totales} días): ${renta_calculada:,.2f}\n"
                f"Depósito: ${deposito:,.2f}\n"
                f"IVA: ${impuesto:,.2f}\n"
                f"Total Pagado: ${total_a_cobrar:,.2f}"
            )

            return Response({
                'mensaje': 'Pago procesado y distribuido correctamente',
                'nuevo_saldo': guest_card.saldo,
                'factura': factura_texto,
                'pdf_url': pago.pdf_factura.url if pago.pdf_factura else None
            })

        except Exception as e:
            print(f"❌ ERROR: {str(e)}")
            return Response({'error': str(e)}, status=500)
    

class TarjetaViewSet(viewsets.ModelViewSet):
    serializer_class = TarjetaSerializer
    permission_classes = [permissions.IsAuthenticated]

    # Solo mostrar las tarjetas DEL usuario logueado
    def get_queryset(self):
        return Tarjeta.objects.filter(usuario=self.request.user)

    # Al crear, asignar automáticamente el usuario y saldo en 0
    def perform_create(self, serializer):
        serializer.save(usuario=self.request.user, saldo=0.00)