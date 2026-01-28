from rest_framework import serializers
from .models import Propiedad, Reserva, PerfilUsuario, FotoPropiedad


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