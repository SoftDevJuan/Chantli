from rest_framework import serializers
from .models import *
from django.contrib.auth.models import User


class NotificacionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notificacion
        fields = '__all__'

class PagoSerializer(serializers.ModelSerializer):
    propiedad_titulo = serializers.ReadOnlyField(source='reserva.propiedad.titulo')
    propiedad_imagen = serializers.ReadOnlyField(source='reserva.propiedad.imagen.url')
    fecha_formateada = serializers.DateTimeField(source='fecha_pago', format="%d/%m/%Y")
    
    # Campo calculado para enviar el nombre del cliente
    nombre_cliente = serializers.ReadOnlyField(source='pagador.first_name')
    apellido_cliente = serializers.ReadOnlyField(source='pagador.last_name')

    class Meta:
        model = Pago
        fields = [
            'id', 
            'monto_renta', 
            'monto_deposito',  # <--- AGREGADO
            'total_pagado', 
            'fecha_formateada', 
            'pdf_factura', 
            'propiedad_titulo',
            'propiedad_imagen',
            'nombre_cliente',
            'apellido_cliente'
        ]

class MensajeSerializer(serializers.ModelSerializer):
    es_mio = serializers.SerializerMethodField()

    class Meta:
        model = Mensaje
        fields = ['id', 'remitente', 'destinatario', 'contenido', 'fecha', 'es_mio']
        # AGREGAR ESTA LÍNEA:
        read_only_fields = ['remitente', 'fecha', 'es_mio']

    def get_es_mio(self, obj):
        request = self.context.get('request')
        if request:
            return obj.remitente == request.user
        return False

# ACTUALIZA TU RESERVA SERIALIZER EXISTENTE ASI:
class ReservaSerializer(serializers.ModelSerializer):
    # Datos de la propiedad
    propiedad_titulo = serializers.ReadOnlyField(source='propiedad.titulo')
    propiedad_precio = serializers.ReadOnlyField(source='propiedad.precio')
    propiedad_imagen = serializers.ImageField(source='propiedad.imagen', read_only=True)
    propiedad_direccion = serializers.ReadOnlyField(source='propiedad.direccion') # NUEVO

    # Datos del Huésped (Lo que ya tenías para el host)
    huesped_nombre = serializers.ReadOnlyField(source='huesped.first_name')
    huesped_apellido = serializers.ReadOnlyField(source='huesped.last_name')
    huesped_foto = serializers.ImageField(source='huesped.perfil.foto_perfil', read_only=True)
    huesped_id = serializers.ReadOnlyField(source='huesped.id')

    # NUEVO: Datos del Anfitrión (Para que el huésped los vea en su historial)
    anfitrion_id = serializers.ReadOnlyField(source='propiedad.anfitrion.id')
    anfitrion_nombre = serializers.ReadOnlyField(source='propiedad.anfitrion.first_name')
    anfitrion_apellido = serializers.ReadOnlyField(source='propiedad.anfitrion.last_name')
    anfitrion_username = serializers.ReadOnlyField(source='propiedad.anfitrion.username')
    anfitrion_foto = serializers.ImageField(source='propiedad.anfitrion.perfil.foto_perfil', read_only=True)

    class Meta:
        model = Reserva
        fields = '__all__'

class FotoPropiedadSerializer(serializers.ModelSerializer):
    class Meta:
        model = FotoPropiedad
        fields = ['id', 'imagen']

# 2. Serializer Principal actualizado
class PropiedadSerializer(serializers.ModelSerializer):
    anfitrion = serializers.ReadOnlyField(source='anfitrion.username')
    # Esto trae las fotos extra anidadas
    album = FotoPropiedadSerializer(many=True, read_only=True) 
    anfitrion_id = serializers.ReadOnlyField(source='anfitrion.id')

    class Meta:
        model = Propiedad
        fields = '__all__'
        extra_kwargs = {
            'anfitrion': {'read_only': True}
        }

class PerfilUsuarioSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='usuario.username', read_only=True)
    email = serializers.EmailField(source='usuario.email', read_only=True)
    
    # Opcional: Para mostrar la URL completa de las imágenes si hace falta
    foto_perfil = serializers.ImageField(required=False)

    class Meta:
        model = PerfilUsuario
        fields = '__all__'
        # Protegemos estos campos para que nadie se "autoverifique" enviando True en el JSON
        read_only_fields = ['es_anfitrion_verificado', 'es_huesped_verificado', 'requiere_deposito_garantia', 'rol']



class UserSerializer(serializers.ModelSerializer):
    # Campos individuales (los que ya tenías)
    rol = serializers.ReadOnlyField(source='perfil.rol')
    foto_perfil = serializers.ImageField(source='perfil.foto_perfil', read_only=True)
    telefono = serializers.ReadOnlyField(source='perfil.telefono')
    biografia = serializers.ReadOnlyField(source='perfil.biografia')

    # --- AGREGAR ESTO ---
    # Esto envía el objeto perfil completo anidado, incluyendo 'es_anfitrion_verificado'
    perfil = PerfilUsuarioSerializer(read_only=True) 

    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 
            'first_name', 'last_name',
            'rol', 'foto_perfil', 'telefono', 'biografia',
            'is_superuser', 'is_staff',
            'perfil', # <--- NO OLVIDES AGREGARLO AQUI
        ]

class RegistroSerializer(serializers.ModelSerializer):
    # Campos extra que no están directamente en el modelo User o requieren validación especial
    rol = serializers.ChoiceField(choices=PerfilUsuario.ROLES, write_only=True)
    password = serializers.CharField(write_only=True, min_length=6)
    email = serializers.EmailField(required=True)

    class Meta:
        model = User
        fields = ['username', 'email', 'password', 'rol']

    def validate_email(self, value):
        # Evitar emails duplicados
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("Este correo ya está registrado.")
        return value

    def create(self, validated_data):
        rol = validated_data.pop('rol')
        username = validated_data.get('username')
        email = validated_data.get('email')

        # 1. VALIDACIÓN PREVIA (Evita el error que mencionas)
        if User.objects.filter(username=username).exists():
            raise serializers.ValidationError({"username": "Este nombre de usuario ya está en uso."})
        
        if User.objects.filter(email=email).exists():
            raise serializers.ValidationError({"email": "Este correo ya está registrado."})

        # 2. CREAR USUARIO (Solo si pasó la validación)
        user = User.objects.create_user(
            username=username,
            email=email,
            password=validated_data['password']
        )

        PerfilUsuario.objects.update_or_create(
            usuario=user,
            defaults={'rol': rol}
        )
        
        return user
    
class UserUpdateSerializer(serializers.ModelSerializer):
    # --- PERFIL (Campos manuales) ---
    telefono = serializers.CharField(required=False, allow_blank=True)
    biografia = serializers.CharField(required=False, allow_blank=True)
    foto_perfil = serializers.ImageField(required=False)
    
    # --- USER (Campos manuales) ---
    # AGREGADO: allow_blank=True es vital para que no falle si envías texto vacío
    email = serializers.EmailField(required=False)
    first_name = serializers.CharField(required=False, allow_blank=True) 
    last_name = serializers.CharField(required=False, allow_blank=True)

    class Meta:
        model = User
        fields = ['first_name', 'last_name', 'email', 'telefono', 'biografia', 'foto_perfil']

    def to_representation(self, instance):
        ret = super().to_representation(instance)
        ret['telefono'] = instance.perfil.telefono
        ret['biografia'] = instance.perfil.biografia
        if instance.perfil.foto_perfil:
            ret['foto_perfil'] = instance.perfil.foto_perfil.url
        else:
            ret['foto_perfil'] = None
        return ret

    def update(self, instance, validated_data):
        print("--- INICIANDO UPDATE ---")
        
        # 1. Actualizar datos del Usuario (User)
        # Usamos .get() para no borrar los datos si los necesitamos luego
        new_first_name = validated_data.get('first_name')
        new_last_name = validated_data.get('last_name')
        new_email = validated_data.get('email')

        if new_first_name is not None: instance.first_name = new_first_name
        if new_last_name is not None: instance.last_name = new_last_name
        if new_email is not None: instance.email = new_email
        instance.save()
        print(f"Usuario {instance.username} actualizado.")

        # 2. Actualizar Perfil (PerfilUsuario)
        try:
            perfil = instance.perfil
        except:
            print("ERROR CRÍTICO: El usuario no tiene perfil asociado.")
            return instance

        # Extracción de datos de texto
        telefono = validated_data.get('telefono')
        biografia = validated_data.get('biografia')

        if telefono is not None: perfil.telefono = telefono
        if biografia is not None: perfil.biografia = biografia

        # 3. MANEJO DE FOTO (MÉTODO DIRECTO)
        # No confiamos en validated_data. Vamos directo a la fuente (request.FILES)
        request = self.context.get('request')
        foto_subida = None
        
        if request and request.FILES:
            # Buscamos 'foto_perfil' en los archivos crudos
            foto_subida = request.FILES.get('foto_perfil')
            print(f"¿Archivo encontrado en request.FILES?: {foto_subida}")

        if foto_subida:
            perfil.foto_perfil = foto_subida
            print("Foto asignada al perfil.")
        
        perfil.save()
        print("Perfil guardado correctamente.")

        return instance
    
class TarjetaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tarjeta
        fields = '__all__'  # Traer todos los campos (id, numero, saldo, etc.)
        read_only_fields = ['usuario', 'saldo']


class ResenaSerializer(serializers.ModelSerializer):
    autor_nombre = serializers.ReadOnlyField(source='autor.first_name')
    autor_foto = serializers.ImageField(source='autor.perfil.foto_perfil', read_only=True)

    class Meta:
        model = Resena
        fields = '__all__'
        read_only_fields = ['autor', 'fecha']
        

class ResenaUsuarioSerializer(serializers.ModelSerializer):
    autor_nombre = serializers.ReadOnlyField(source='autor.first_name')
    autor_foto = serializers.ImageField(source='autor.perfil.foto_perfil', read_only=True)

    class Meta:
        model = ResenaUsuario
        fields = '__all__'
        # --- AGREGA ESTA LÍNEA ---
        read_only_fields = ['autor', 'fecha']

class FavoritoSerializer(serializers.ModelSerializer):
    # Anidamos el serializer de la propiedad para que devuelva todos sus datos
    propiedad = PropiedadSerializer(read_only=True)

    class Meta:
        model = Favorito
        fields = ['id', 'propiedad', 'fecha_agregado']