from rest_framework import serializers
from .models import Propiedad, Reserva, PerfilUsuario, FotoPropiedad
from django.contrib.auth.models import User


class ReservaSerializer(serializers.ModelSerializer):
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

    class Meta:
        model = Propiedad
        fields = '__all__'
        extra_kwargs = {
            'anfitrion': {'read_only': True}
        }

class UserSerializer(serializers.ModelSerializer):
    rol = serializers.ReadOnlyField(source='perfil.rol')
    foto_perfil = serializers.ImageField(source='perfil.foto_perfil', read_only=True)

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'rol', 'foto_perfil']

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
        # Sacamos el rol del diccionario porque no va en el modelo User
        rol = validated_data.pop('rol')
        
        # 1. Crear Usuario Base
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password']
        )

        # 2. Crear Perfil con el Rol seleccionado
        PerfilUsuario.objects.create(usuario=user, rol=rol)
        
        return user