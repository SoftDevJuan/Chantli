from rest_framework import viewsets, permissions, status, filters, generics
from rest_framework.authtoken.models import Token
from rest_framework.decorators import action
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAdminUser, IsAuthenticated
from django.shortcuts import get_object_or_404
# Asegúrate de importar tus modelos y el serializer
from .serializers import PagoSerializer
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
from django.db.models import Sum, Count, Avg
from django.db.models.functions import TruncMonth
from django.utils import timezone
from django.template.loader import render_to_string
from django.core.mail import EmailMessage
from django.core.files.base import ContentFile
from xhtml2pdf import pisa
from django.conf import settings

# --- IMPORTACIÓN DE WEB PUSH ---
from webpush import send_user_notification
from webpush.models import PushInformation, SubscriptionInfo


class PropiedadViewSet(viewsets.ModelViewSet):
    queryset = Propiedad.objects.all()
    serializer_class = PropiedadSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    
    # Campos donde buscará cuando uses ?search=texto
    search_fields = ['titulo', 'descripcion', 'direccion', 'amenidades']
    
    # Campos por los que se puede ordenar cuando uses ?ordering=precio
    ordering_fields = ['precio', 'fecha_publicacion']

    # --- 1. NUEVO MÉTODO: EL FILTRO DE SEGURIDAD ---
    # Este método se ejecuta ANTES de guardar nada.
    def create(self, request, *args, **kwargs):
        try:
            # Buscamos el perfil del usuario (PerfilUsuario)
            perfil = request.user.perfil 
            
            # Verificamos si el admin ya le dio el visto bueno
            if not perfil.es_anfitrion_verificado:
                return Response(
                    {"error": "No puedes publicar propiedades hasta que verifiquemos tu identidad. Ve a tu perfil y sube tus documentos."}, 
                    status=status.HTTP_403_FORBIDDEN
                )
        except Exception as e:
            # Si el usuario no tiene perfil o pasa algo raro
            return Response({"error": "Error al verificar tu perfil."}, status=status.HTTP_400_BAD_REQUEST)

        # Si pasa la validación, dejamos que Django siga normal.
        return super().create(request, *args, **kwargs)

    # --- 2. TU MÉTODO EXISTENTE (Se queda igual) ---
    def perform_create(self, serializer):
        # 1. Guardamos la propiedad principal
        propiedad = serializer.save(anfitrion=self.request.user)

        # 2. Buscamos si vienen fotos extra
        imagenes_extra = self.request.FILES.getlist('fotos_extra')

        # 3. Creamos un objeto FotoPropiedad por cada imagen
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

    @action(detail=False, methods=['get'], url_path='por_usuario/(?P<user_id>\d+)')
    def por_usuario(self, request, user_id=None):
        # Esta ruta filtrará las propiedades por el ID del dueño
        # No requiere autenticación porque los perfiles son públicos
        propiedades = Propiedad.objects.filter(anfitrion_id=user_id)
        
        # Opcional: Podrías filtrar solo las propiedades 'activas' si tienes ese campo
        # propiedades = Propiedad.objects.filter(anfitrion_id=user_id, activa=True)
        
        serializer = self.get_serializer(propiedades, many=True)
        return Response(serializer.data)


    @action(detail=False, methods=['get'])
    def resumen_anfitrion(self, request):
        usuario = request.user
        
        # 1. Obtener mis propiedades
        mis_propiedades = Propiedad.objects.filter(anfitrion=usuario)
        total_propiedades = mis_propiedades.count()

        # 2. Calcular Ganancias Totales (Sumando Saldo de Tarjetas)
        mis_tarjetas = Tarjeta.objects.filter(usuario=usuario)
        total_en_billetera = mis_tarjetas.aggregate(total=Sum('saldo'))['total'] or 0

        # 3. Calcular Ocupación Mensual
        hace_6_meses = timezone.now() - datetime.timedelta(days=180)
        
        reservas_por_mes = Reserva.objects.filter(
            propiedad__in=mis_propiedades,
            estado='pagada',
            fecha_inicio__gte=hace_6_meses
        ).annotate(mes=TruncMonth('fecha_inicio')).values('mes').annotate(total=Count('id')).order_by('mes')

        grafica_mensual = []
        for r in reservas_por_mes:
            nombre_mes = r['mes'].strftime('%B') 
            porcentaje = (r['total'] / total_propiedades) * 100 if total_propiedades > 0 else 0
            grafica_mensual.append({
                'mes': nombre_mes,
                'cantidad': r['total'],
                'porcentaje': min(porcentaje, 100)
            })

        # 4. Promedio de Calificaciones (Fijo en 5.0 por ahora)
        calificacion_promedio = 5.0

        # 5. Conteo histórico
        reservas_historicas = Reserva.objects.filter(
            propiedad__in=mis_propiedades, 
            estado='pagada'
        ).count()

        return Response({
            'ganancias_totales': total_en_billetera,
            'reservas_pagadas': reservas_historicas,
            'calificacion_promedio': calificacion_promedio,
            'grafica_mensual': grafica_mensual
        })
    

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
        mensaje = serializer.save(remitente=self.request.user)
        
        # --- NUEVO: PUSH NOTIFICATION PARA EL CHAT ---
        remitente_nombre = self.request.user.first_name or self.request.user.username
        payload = {
            "head": f"Nuevo mensaje de {remitente_nombre}",
            "body": mensaje.contenido[:40] + "..." if len(mensaje.contenido) > 40 else mensaje.contenido,
            "url": "/inbox"
        }
        send_user_notification(user=mensaje.destinatario, payload=payload, ttl=1000)

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
            
            # --- 1. LÓGICA PARA CALCULAR SI ESTÁ EN LÍNEA ---
            is_online = False
            try:
                if target_user.perfil.ultima_actividad:
                    # Restamos la hora actual menos su última actividad
                    tiempo_pasado = timezone.now() - target_user.perfil.ultima_actividad
                    # Si han pasado menos de 3 minutos (180 segundos), lo consideramos conectado
                    if tiempo_pasado.total_seconds() < 180:
                        is_online = True
            except:
                pass # Por si ocurre un error o el usuario no tiene perfil
            # ------------------------------------------------

            data = {
                'id': target_user.id,
                'nombre': f"{target_user.first_name} {target_user.last_name}".strip() or target_user.username,
                'foto': foto_url,
                'isOnline': is_online # --- 2. ENVIAMOS LA VARIABLE A REACT ---
            }
            return Response(data)
        except User.DoesNotExist:
            return Response({'error': 'Usuario no encontrado'}, status=404)

    # --- 3. Actualizar Conversación (Marcar como leídos al abrir) ---
    @action(detail=False, methods=['get'], url_path='conversacion/(?P<user_id>\d+)')
    def conversacion(self, request, user_id=None):
        
        # --- NUEVO: REGISTRAR QUE EL USUARIO ACTUAL ESTÁ VIVO (LATIDO) ---
        try:
            perfil = request.user.perfil
            perfil.ultima_actividad = timezone.now()
            perfil.save(update_fields=['ultima_actividad']) # Solo guardamos este campo para que sea súper rápido
        except:
            pass
        # -----------------------------------------------------------------

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
        mensajes = Mensaje.objects.filter(
            Q(remitente=user) | Q(destinatario=user)
        ).select_related('remitente__perfil', 'destinatario__perfil').order_by('-fecha')

        conversaciones = {}
        
        for msg in mensajes:
            otro_usuario = msg.destinatario if msg.remitente == user else msg.remitente
            
            if otro_usuario.id not in conversaciones:
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
                    'es_mio': msg.remitente == user 
                }

        return Response(conversaciones.values())

class ReservaViewSet(viewsets.ModelViewSet):
    # 1. PRIMERO PONEMOS LAS PROPIEDADES DE LA CLASE
    serializer_class = ReservaSerializer
    permission_classes = [permissions.IsAuthenticated]

    # 2. LUEGO DEFINIMOS LOS MÉTODOS
    def get_queryset(self):
        # Solo devuelve las reservas donde el usuario logueado sea el HUESPED
        # o donde el usuario logueado sea el DUEÑO de la propiedad
        usuario = self.request.user
        
        return Reserva.objects.filter(
            Q(huesped=usuario) | Q(propiedad__anfitrion=usuario)
        ).order_by('-fecha_creacion')

    @action(detail=False, methods=['get'])
    def solicitudes_recibidas(self, request):
        reservas = Reserva.objects.filter(propiedad__anfitrion=request.user).order_by('-fecha_creacion')
        serializer = self.get_serializer(reservas, many=True)
        return Response(serializer.data)

    def perform_create(self, serializer):
        reserva = serializer.save(huesped=self.request.user)
        dueño = reserva.propiedad.anfitrion
        
        # 1. Notificación interna (Base de datos)
        Notificacion.objects.create(
            usuario=dueño,
            mensaje=f"Nueva solicitud de reserva para {reserva.propiedad.titulo}",
            reserva_id=reserva.id
        )

        # 2. --- NUEVO: PUSH NOTIFICATION AL ANFITRIÓN ---
        payload = {
            "head": "Nueva Solicitud de Reserva",
            "body": f"{self.request.user.first_name or self.request.user.username} quiere rentar tu propiedad.",
            "url": "/host" 
        }
        try:
            send_user_notification(user=dueño, payload=payload, ttl=1000)
        except Exception as e:
            print("Error enviando push:", e)

    @action(detail=True, methods=['patch'])
    def responder(self, request, pk=None):
        reserva = self.get_object()
        nuevo_estado = request.data.get('estado')
        
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
            # --- NUEVO: PUSH NOTIFICATION AL HUÉSPED ---
            payload = {
                "head": "¡Reserva Aceptada! 🎉",
                "body": f"El anfitrión aceptó tu solicitud para {reserva.propiedad.titulo}. Entra para pagar.",
                "url": "/home" # Puedes mandarlo a un listado de reservas pendientes
            }
            try:
                send_user_notification(user=reserva.huesped, payload=payload, ttl=1000)
            except Exception as e:
                print("Error enviando push:", e)

        elif nuevo_estado == 'rechazada':
            Notificacion.objects.create(
                usuario=reserva.huesped,
                mensaje=f"Tu solicitud en {reserva.propiedad.titulo} fue rechazada.",
                reserva_id=reserva.id
            )
            # --- NUEVO: PUSH NOTIFICATION AL HUÉSPED ---
            payload = {
                "head": "Reserva Rechazada",
                "body": f"Lo sentimos, el anfitrión no aceptó la solicitud para {reserva.propiedad.titulo}.",
                "url": "/home"
            }
            try:
                send_user_notification(user=reserva.huesped, payload=payload, ttl=1000)
            except Exception as e:
                print("Error enviando push:", e)

        return Response({'status': 'ok', 'estado': reserva.estado})
    

class CurrentUserView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = (MultiPartParser, FormParser) 

    def get(self, request):
        serializer = UserSerializer(request.user, context={'request': request})
        return Response(serializer.data)

    def patch(self, request):
        serializer = UserUpdateSerializer(
            request.user, 
            data=request.data, 
            partial=True,
            context={'request': request}
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
        rol_seleccionado = request.data.get('rol', 'huesped')

        try:
            CLIENT_ID = "485296325778-9i5j0efprjtgil4v66cr1p46rg18sjne.apps.googleusercontent.com" 
            idinfo = id_token.verify_oauth2_token(token_google, google_requests.Request(), CLIENT_ID)

            email = idinfo['email']
            username = email.split('@')[0]

            try:
                user = User.objects.get(email=email)
            except User.DoesNotExist:
                user = User.objects.create_user(username=username, email=email)
                user.set_unusable_password()
                user.save()
                PerfilUsuario.objects.create(usuario=user, rol=rol_seleccionado)

            token, created = Token.objects.get_or_create(user=user)
            
            return Response({'token': token.key, 'username': user.username})

        except ValueError:
            return Response({'error': 'Token de Google inválido'}, status=status.HTTP_400_BAD_REQUEST)
        

class PagoViewSet(viewsets.ModelViewSet):
    serializer_class = PagoSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Pago.objects.filter(pagador=self.request.user).order_by('-fecha_pago')

    @action(detail=False, methods=['post'])
    def procesar(self, request):
        reserva_id = request.data.get('reserva_id')
        tarjeta_id = request.data.get('tarjeta_id')

        try:
            if Pago.objects.filter(reserva_id=reserva_id).exists():
                return Response({'error': 'Esta reserva ya ha sido pagada previamente.'}, status=400)

            reserva = Reserva.objects.get(id=reserva_id)
            guest_card = Tarjeta.objects.get(id=tarjeta_id, usuario=request.user)
            
            choques = Reserva.objects.filter(
                propiedad=reserva.propiedad,
                estado__in=['pagada', 'aceptada'],
                fecha_inicio__lt=reserva.fecha_fin,
                fecha_fin__gt=reserva.fecha_inicio
            ).exclude(id=reserva.id)

            if choques.exists():
                return Response({'error': 'Las fechas seleccionadas ya no están disponibles. Alguien ganó la reserva.'}, status=400)

            dias_totales = (reserva.fecha_fin - reserva.fecha_inicio).days
            if dias_totales < 1: dias_totales = 1

            precio_mensual = Decimal(str(reserva.propiedad.precio))
            precio_diario = precio_mensual / Decimal('30')
            renta_calculada = precio_diario * Decimal(dias_totales)
            deposito = precio_mensual 
            impuesto = renta_calculada * Decimal('0.16')
            total_a_cobrar = renta_calculada + deposito + impuesto

            if guest_card.saldo < total_a_cobrar:
                return Response({'error': f'Fondos insuficientes. Total a pagar: ${total_a_cobrar:,.2f}'}, status=400)

            admin_user = User.objects.filter(is_superuser=True).first()
            if not admin_user:
                return Response({'error': 'Configuración crítica: No existe usuario Administrador para recibir fondos.'}, status=500)
            
            admin_card = Tarjeta.objects.filter(usuario=admin_user).first()
            if not admin_card:
                return Response({'error': 'El Administrador no tiene una cuenta configurada para recibir pagos.'}, status=500)

            host_user = reserva.propiedad.anfitrion
            host_card = Tarjeta.objects.filter(usuario=host_user).first()
            if not host_card:
                return Response({'error': f'El anfitrión {host_user.first_name} no ha registrado una cuenta para recibir su dinero.'}, status=400)

            # EJECUTAR TRANSACCIONES
            guest_card.saldo -= total_a_cobrar
            guest_card.save()

            admin_card.saldo += total_a_cobrar
            admin_card.save()

            comision_app = renta_calculada * Decimal('0.05')
            ganancia_anfitrion = total_a_cobrar - comision_app

            if admin_card.saldo >= ganancia_anfitrion:
                admin_card.saldo -= ganancia_anfitrion
                host_card.saldo += ganancia_anfitrion
                
                admin_card.save()
                host_card.save()

            pago = Pago.objects.create(
                reserva=reserva,
                pagador=request.user,
                monto_renta=renta_calculada,
                monto_deposito=deposito,
                comision_app=comision_app,
                ganancia_anfitrion=ganancia_anfitrion,
                total_pagado=total_a_cobrar
            )

            reserva.estado = 'pagada'
            reserva.save()

            try:
                context = {
                    'pago': pago, 
                    'impuesto': impuesto, 
                    'dias': dias_totales,
                    'precio_diario': precio_diario
                }
                html_string = render_to_string('recibo_pago.html', context)
                pdf_file = io.BytesIO()
                pisa_status = pisa.CreatePDF(io.BytesIO(html_string.encode("UTF-8")), dest=pdf_file)
                
                if not pisa_status.err:
                    filename = f"recibo_chantli_{pago.id}.pdf"
                    pago.pdf_factura.save(filename, ContentFile(pdf_file.getvalue()))
                    pago.save()
                    
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

            # --- NUEVO: PUSH NOTIFICATIONS DESPUÉS DE UN PAGO EXITOSO ---
            
            # Notificar al Dueño (Host)
            Notificacion.objects.create(
                usuario=host_user,
                mensaje=f"¡Has recibido un pago de ${ganancia_anfitrion:,.2f} por tu propiedad {reserva.propiedad.titulo}!",
                reserva_id=reserva.id
            )
            payload_host = {
                "head": "¡Pago Recibido! 💰",
                "body": f"Se acreditó el pago de tu reserva en {reserva.propiedad.titulo}.",
                "url": "/host"
            }
            send_user_notification(user=host_user, payload=payload_host, ttl=1000)

            # Notificar al Huésped (El que pagó)
            payload_guest = {
                "head": "Pago Exitoso ✅",
                "body": f"Tu estadía en {reserva.propiedad.titulo} está 100% confirmada.",
                "url": "/invoices"
            }
            send_user_notification(user=request.user, payload=payload_guest, ttl=1000)

            # -------------------------------------------------------------

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
            return Response({'error': str(e)}, status=500)
    

class TarjetaViewSet(viewsets.ModelViewSet):
    serializer_class = TarjetaSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Tarjeta.objects.filter(usuario=self.request.user)

    def perform_create(self, serializer):
        serializer.save(usuario=self.request.user, saldo=0.00)


class PerfilUsuarioViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = PerfilUsuarioSerializer
    queryset = PerfilUsuario.objects.all()

    def get_object(self):
        obj, created = PerfilUsuario.objects.get_or_create(usuario=self.request.user)
        return obj

    @action(detail=False, methods=['get', 'patch'], parser_classes=[MultiPartParser, FormParser])
    def subir_documentos(self, request):
        perfil = self.get_object()

        # ==================================================
        # 0. LÓGICA DE LECTURA (Para que React sepa qué mostrar)
        # ==================================================
        if request.method == 'GET':
            serializer = self.get_serializer(perfil)
            return Response(serializer.data)

        # ==================================================
        # 1. LÓGICA DE CANCELACIÓN DE VALIDACIÓN
        # ==================================================
        if request.data.get('cancelar_validacion') == 'true':
            # Eliminamos los archivos físicamente del servidor para no acumular basura
            if perfil.identificacion_frente: perfil.identificacion_frente.delete(save=False)
            if perfil.identificacion_reverso: perfil.identificacion_reverso.delete(save=False)
            if perfil.foto_selfie: perfil.foto_selfie.delete(save=False)
            if perfil.comprobante_domicilio_propiedad: perfil.comprobante_domicilio_propiedad.delete(save=False)
            if perfil.constancia_estudios_trabajo: perfil.constancia_estudios_trabajo.delete(save=False)

            # Reseteamos los estatus
            perfil.es_huesped_verificado = False
            perfil.es_anfitrion_verificado = False
            perfil.acepto_terminos_y_reglamento = False
            perfil.requiere_deposito_garantia = True
            
            perfil.save()
            return Response({"status": "Validación cancelada y documentos eliminados"}, status=status.HTTP_200_OK)

        # ==================================================
        # 2. LÓGICA NORMAL (GUARDAR / EDITAR)
        # ==================================================
        serializer = self.get_serializer(perfil, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            
            if perfil.constancia_estudios_trabajo:
                perfil.requiere_deposito_garantia = False
                perfil.save()

            # Notificaciones
            if request.data.get('fue_editado') == 'true':
                Notificacion.objects.create(
                    usuario=request.user,
                    mensaje="Tus documentos de verificación han sido actualizados y enviados a revisión."
                )
                try:
                    send_user_notification(user=request.user, payload={"head": "Validación", "body": "Documentos enviados a revisión."}, ttl=1000)
                except Exception:
                    pass

                admins = User.objects.filter(is_staff=True)
                for admin in admins:
                    Notificacion.objects.create(
                        usuario=admin,
                        mensaje=f"@{request.user.username} ha subido/actualizado sus documentos."
                    )
                    try:
                        send_user_notification(user=admin, payload={"head": "Nueva Validación", "body": f"@{request.user.username} subió documentos."}, ttl=1000)
                    except Exception:
                        pass

            return Response(serializer.data)
        
        return Response(serializer.errors, status=400)
    
    @action(detail=False, methods=['get'], permission_classes=[permissions.IsAdminUser])
    def admin_pendientes(self, request):
        perfiles = PerfilUsuario.objects.filter(
            Q(identificacion_frente__isnull=False) | Q(constancia_estudios_trabajo__isnull=False)
        ).order_by('-id')
        
        serializer = self.get_serializer(perfiles, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['patch'], permission_classes=[permissions.IsAdminUser])
    def admin_verificar(self, request, pk=None):
        try:
            perfil = PerfilUsuario.objects.get(pk=pk)
        except PerfilUsuario.DoesNotExist:
            return Response({"error": "Perfil no encontrado"}, status=404)

        tipo = request.data.get('tipo')
        valor = request.data.get('valor') # True o False

        if tipo == 'anfitrion':
            perfil.es_anfitrion_verificado = valor
        elif tipo == 'huesped':
            perfil.es_huesped_verificado = valor
            if valor: 
                perfil.requiere_deposito_garantia = False
        
        perfil.save()

        # ==================================================
        # NOTIFICAR AL USUARIO SU RESULTADO DE VALIDACIÓN
        # ==================================================
        try:
            estado_texto = "APROBADO" if valor else "REVOCADO"
            payload_resultado = {
                "head": f"Perfil de {tipo.capitalize()} {estado_texto}", 
                "body": f"Tu validación como {tipo} ha sido procesada por el equipo de Chantli."
            }
            send_user_notification(user=perfil.usuario, payload=payload_resultado, ttl=1000)
        except Exception as e:
            print("Error enviando push de resultado:", e)

        return Response({"status": "Actualizado", "anfitrion": perfil.es_anfitrion_verificado, "huesped": perfil.es_huesped_verificado})
    

class ResenaViewSet(viewsets.ModelViewSet):
    
    serializer_class = ResenaSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        queryset = Resena.objects.all()
        propiedad_id = self.request.query_params.get('propiedad')
        if propiedad_id:
            queryset = queryset.filter(propiedad_id=propiedad_id)
        return queryset.order_by('-fecha')

    def perform_create(self, serializer):
        usuario = self.request.user
        propiedad_id = self.request.data.get('propiedad')
        
        tiene_reserva = Reserva.objects.filter(
            huesped=usuario, 
            propiedad_id=propiedad_id,
            estado__in=['pagada', 'finalizada']
        ).exists()

        if not tiene_reserva:
            raise serializers.ValidationError("Solo puedes opinar si has reservado este lugar.")
            
        serializer.save(autor=usuario)


class ResenaUsuarioViewSet(viewsets.ModelViewSet):
    queryset = ResenaUsuario.objects.all()
    serializer_class = ResenaUsuarioSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def perform_create(self, serializer):
        serializer.save(autor=self.request.user)
        
    @action(detail=False, methods=['get'])
    def usuario(self, request):
        user_id = request.query_params.get('id')
        resenas = self.queryset.filter(destinatario_id=user_id).order_by('-fecha')
        serializer = self.get_serializer(resenas, many=True)
        return Response(serializer.data)


class PublicUserProfileView(APIView):
    def get(self, request, pk):
        try:
            user = User.objects.get(pk=pk)
            serializer = UserSerializer(user) 
            return Response(serializer.data)
        except User.DoesNotExist:
            return Response(status=404)
        

class FavoritoViewSet(viewsets.ModelViewSet):
    serializer_class = FavoritoSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Favorito.objects.filter(usuario=self.request.user).order_by('-fecha_agregado')

    @action(detail=False, methods=['post'])
    def toggle(self, request):
        propiedad_id = request.data.get('propiedad_id')
        if not propiedad_id:
            return Response({'error': 'ID de propiedad requerido'}, status=status.HTTP_400_BAD_REQUEST)

        propiedad = get_object_or_404(Propiedad, id=propiedad_id)
        
        favorito, created = Favorito.objects.get_or_create(
            usuario=request.user, 
            propiedad=propiedad
        )
        
        if not created:
            favorito.delete()
            return Response({'status': 'removido', 'is_favorite': False})
        
        return Response({'status': 'agregado', 'is_favorite': True})

    @action(detail=False, methods=['get'])
    def check(self, request):
        propiedad_id = request.query_params.get('propiedad')
        if not propiedad_id:
            return Response({'error': 'Falta el parámetro propiedad'}, status=status.HTTP_400_BAD_REQUEST)
        
        is_favorite = Favorito.objects.filter(
            usuario=request.user, 
            propiedad_id=propiedad_id
        ).exists()
        
        return Response({'is_favorite': is_favorite})


class SubscribePushView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        data = request.data
        sub_data = data.get('subscription', {})
        endpoint = sub_data.get('endpoint')
        keys = sub_data.get('keys', {})
        p256dh = keys.get('p256dh')
        auth = keys.get('auth')

        if not endpoint or not p256dh or not auth:
            return Response({'error': 'Datos de suscripción incompletos'}, status=status.HTTP_400_BAD_REQUEST)

        # 1. Obtenemos el nombre del navegador. Si no viene, usamos "Chantli PWA".
        raw_browser = data.get('browser', 'Chantli PWA')
        
        # 2. EL ARREGLO: Recortamos la cadena para que tenga como MÁXIMO 100 caracteres.
        safe_browser = raw_browser[:100]

        # 3. Guardamos la información
        sub_info, created = SubscriptionInfo.objects.get_or_create(
            endpoint=endpoint,
            defaults={
                'p256dh': p256dh,
                'auth': auth,
                'browser': safe_browser # Usamos la versión recortada
            }
        )
        
        if not created:
            sub_info.p256dh = p256dh
            sub_info.auth = auth
            sub_info.browser = safe_browser # Actualizamos también aquí por si acaso
            sub_info.save()

        PushInformation.objects.get_or_create(
            user=request.user,
            subscription=sub_info
        )

        return Response({'status': 'Dispositivo suscrito con éxito'}, status=status.HTTP_201_CREATED)


class UnsubscribePushView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        endpoint = request.data.get('endpoint')
        
        if not endpoint:
            return Response({'error': 'Falta el endpoint'}, status=status.HTTP_400_BAD_REQUEST)

        # Buscamos y borramos la relación exacta entre este usuario y este navegador
        # Usamos filter().delete() en lugar de get() para evitar errores si hay duplicados
        PushInformation.objects.filter(
            user=request.user, 
            subscription__endpoint=endpoint
        ).delete()

        return Response({'status': 'Dispositivo desvinculado con éxito'}, status=status.HTTP_200_OK)