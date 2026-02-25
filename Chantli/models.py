from django.db import models
from django.contrib.auth.models import User
from django.core.validators import MinValueValidator
from django.db.models.signals import post_save
from django.dispatch import receiver



class PerfilUsuario(models.Model):
    # --- TUS CAMPOS ORIGINALES ---
    ROLES = (('anfitrion', 'Anfitrión'), ('huesped', 'Huésped'))
    usuario = models.OneToOneField(User, on_delete=models.CASCADE, related_name='perfil')
    rol = models.CharField(max_length=20, choices=ROLES, default='huesped')
    telefono = models.CharField(max_length=15, blank=True)
    biografia = models.TextField(blank=True, help_text="Descripción para generar confianza")
    foto_perfil = models.ImageField(upload_to='perfiles/', null=True, blank=True)
    foto_selfie = models.ImageField(upload_to='verificaciones/selfies/', null=True, blank=True)

    # --- NUEVOS CAMPOS DE VERIFICACIÓN (FUSIÓN) ---
    direccion = models.TextField(blank=True, help_text="Dirección completa con CP")
    
    # Documentación General
    identificacion_frente = models.ImageField(upload_to='documentos/ids/', null=True, blank=True)
    identificacion_reverso = models.ImageField(upload_to='documentos/ids/', null=True, blank=True)
    curp = models.CharField(max_length=18, blank=True) 

    # Datos Fiscales y Anfitrión (Solo si el rol es anfitrion, pero se deja opcional)
    rfc = models.CharField(max_length=13, blank=True)
    constancia_fiscal = models.FileField(upload_to='documentos/fiscal/', null=True, blank=True)
    comprobante_domicilio_propiedad = models.FileField(upload_to='documentos/propiedad/', null=True, blank=True)
    
    # Estados de Verificación (El Admin controla esto)
    es_anfitrion_verificado = models.BooleanField(default=False) 
    
    # Datos Huésped
    referencia_nombre = models.CharField(max_length=100, blank=True)
    referencia_telefono = models.CharField(max_length=15, blank=True)
    constancia_estudios_trabajo = models.FileField(upload_to='documentos/huesped/', null=True, blank=True)
    
    # Flags de control
    requiere_deposito_garantia = models.BooleanField(default=True) 
    es_huesped_verificado = models.BooleanField(default=False)

    # Legal
    acepto_terminos_y_reglamento = models.BooleanField(default=False)
    fecha_aceptacion = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.usuario.username} - {self.rol}"


# Señal para crear el perfil automáticamente
@receiver(post_save, sender=User)
def crear_perfil_usuario(sender, instance, created, **kwargs):
    if created:
        PerfilUsuario.objects.create(usuario=instance)


# 2. Propiedad (El cuarto)
class Propiedad(models.Model):
    anfitrion = models.ForeignKey(User, on_delete=models.CASCADE, related_name='propiedades')
    titulo = models.CharField(max_length=200)
    descripcion = models.TextField()
    direccion = models.CharField(max_length=255)
    precio = models.DecimalField(max_digits=10, decimal_places=2)
    # Guardamos la imagen principal aquí para facilitar el frontend inicial
    imagen = models.ImageField(upload_to='propiedades/', null=True, blank=True)
    disponible = models.BooleanField(default=True)
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    amenidades = models.TextField(blank=True, help_text="Lista de amenidades en formato JSON o texto")
    latitud = models.FloatField(null=True, blank=True)
    longitud = models.FloatField(null=True, blank=True)

    def __str__(self):
        return f"{self.titulo} (${self.precio})"

# 3. Reserva (Transacción)
class Reserva(models.Model):
    ESTADOS = [
        ('pendiente', 'Pendiente'),
        ('esperando_pago', 'Aceptada - Esperando Pago'), # <--- NUEVO
        ('pagada', 'Confirmada - Pagada'),               # <--- NUEVO
        ('rechazada', 'Rechazada'),
        ('cancelada', 'Cancelada'),
        ('finalizada', 'Finalizada'), # Cuando termina la fecha
    ]

    propiedad = models.ForeignKey(Propiedad, on_delete=models.CASCADE)
    huesped = models.ForeignKey(User, on_delete=models.CASCADE)
    fecha_inicio = models.DateField()
    fecha_fin = models.DateField(null=True, blank=True)
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    
    
    # Campo Nuevo
    estado = models.CharField(max_length=20, choices=ESTADOS, default='pendiente')
    
    def __str__(self):
        return f"Reserva de {self.huesped.username} en {self.propiedad.titulo}"
    
class Resena(models.Model):
    propiedad = models.ForeignKey(Propiedad, related_name='resenas', on_delete=models.CASCADE)
    autor = models.ForeignKey(User, on_delete=models.CASCADE)
    calificacion = models.IntegerField(default=5) # 1 a 5
    comentario = models.TextField()
    fecha = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.autor.username} - {self.propiedad.titulo}"
    
class ResenaUsuario(models.Model):
    autor = models.ForeignKey(User, related_name='resenas_escritas', on_delete=models.CASCADE)
    destinatario = models.ForeignKey(User, related_name='resenas_recibidas', on_delete=models.CASCADE)
    calificacion = models.IntegerField(default=5)
    comentario = models.TextField()
    fecha = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"De {self.autor.username} para {self.destinatario.username}"


class Tarjeta(models.Model):
    titular = models.CharField(max_length=100)
    numero = models.CharField(max_length=16, unique=True) # Fake 16 digits
    fecha_vencimiento = models.CharField(max_length=5) # MM/YY
    cvv = models.CharField(max_length=3)
    saldo = models.DecimalField(max_digits=10, decimal_places=2, default=50000.00) # Saldo inicial ficticio
    usuario_dueño = models.ForeignKey(User, on_delete=models.CASCADE, related_name='mis_tarjetas', null=True, blank=True)

    def __str__(self):
        return f"Tarjeta terminada en {self.numero[-4:]} - Saldo: ${self.saldo}"

class Tarjeta(models.Model):
    usuario = models.ForeignKey(User, on_delete=models.CASCADE, related_name='tarjetas')
    nombre_titular = models.CharField(max_length=100)
    numero = models.CharField(max_length=16) # En producción esto se encripta
    fecha_vencimiento = models.CharField(max_length=5) # MM/YY
    cvv = models.CharField(max_length=4)
    saldo = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    
    # Campo para identificar si es la tarjeta predeterminada para cobros/pagos
    es_principal = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.usuario.username} - **** {self.numero[-4:]} (${self.saldo})"

# 2. ACTUALIZACIÓN DEL MODELO PAGO
class Pago(models.Model):
    reserva = models.OneToOneField('Reserva', on_delete=models.CASCADE, related_name='pago_info')
    pagador = models.ForeignKey(User, on_delete=models.CASCADE, related_name='pagos_realizados')
    
    # Desglose Exacto
    monto_renta = models.DecimalField(max_digits=10, decimal_places=2) 
    monto_deposito = models.DecimalField(max_digits=10, decimal_places=2)
    comision_app = models.DecimalField(max_digits=10, decimal_places=2) # 5%
    ganancia_anfitrion = models.DecimalField(max_digits=10, decimal_places=2) # 95%
    
    total_pagado = models.DecimalField(max_digits=10, decimal_places=2) # Renta + Depósito
    
    fecha_pago = models.DateTimeField(auto_now_add=True)
    pdf_factura = models.FileField(upload_to='facturas/', null=True, blank=True)

    def __str__(self):
        return f"Pago #{self.id} - Total: ${self.total_pagado}"


class FotoPropiedad(models.Model):
    propiedad = models.ForeignKey(Propiedad, related_name='album', on_delete=models.CASCADE)
    imagen = models.ImageField(upload_to='propiedades/galeria/')
    fecha_subida = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Foto de {self.propiedad.titulo}"
    

class Notificacion(models.Model):
    usuario = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notificaciones')
    mensaje = models.CharField(max_length=255)
    leida = models.BooleanField(default=False)
    fecha = models.DateTimeField(auto_now_add=True)
    # Opcional: para saber a qué reserva se refiere y redirigir
    reserva_id = models.IntegerField(null=True, blank=True) 

class Mensaje(models.Model):
    remitente = models.ForeignKey(User, on_delete=models.CASCADE, related_name='mensajes_enviados')
    destinatario = models.ForeignKey(User, on_delete=models.CASCADE, related_name='mensajes_recibidos')
    contenido = models.TextField()
    fecha = models.DateTimeField(auto_now_add=True)
    leido = models.BooleanField(default=False)

    class Meta:
        ordering = ['fecha']


    
class Favorito(models.Model):
    usuario = models.ForeignKey(User, on_delete=models.CASCADE, related_name='favoritos')
    propiedad = models.ForeignKey('Propiedad', on_delete=models.CASCADE, related_name='favoritada_por')
    fecha_agregado = models.DateTimeField(auto_now_add=True)

    class Meta:
        # Esto evita que un usuario agregue la misma casa a favoritos dos veces
        unique_together = ('usuario', 'propiedad') 
        verbose_name = 'Favorito'
        verbose_name_plural = 'Favoritos'

    def __str__(self):
        return f"{self.usuario.username} - {self.propiedad.titulo}"