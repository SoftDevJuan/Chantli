import os
import sys
import django
import random
from datetime import timedelta
from django.utils import timezone

# 1. Configurar el entorno de Django
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from Chantli.models import PerfilUsuario, Propiedad, Reserva, Resena 
from django.contrib.auth.models import User

def poblar_base_de_datos():
    print("Iniciando la MEGA generación de datos para Chantli con Imágenes...")

    # --- 1. CREAR 20 ANFITRIONES ---
    anfitriones_creados = []
    print("Creando anfitriones...")
    for i in range(1, 21):
        nombre = f"Host_Gdl_{i}"
        user, created = User.objects.get_or_create(username=nombre, defaults={'email': f'{nombre}@chantli.com'})
        if created:
            user.set_password('chantli123')
            user.save()
            perfil = user.perfil
            perfil.rol = 'anfitrion'
            perfil.es_anfitrion_verificado = True
            perfil.save()
        anfitriones_creados.append(user)

    # --- 2. CREAR 50 HUÉSPEDES ---
    huespedes_creados = []
    print("Creando huéspedes...")
    for i in range(1, 51):
        nombre = f"Foraneo_{i}"
        user, created = User.objects.get_or_create(username=nombre, defaults={'email': f'{nombre}@chantli.com'})
        if created:
            user.set_password('chantli123')
            user.save()
            perfil = user.perfil
            perfil.rol = 'huesped'
            perfil.es_huesped_verificado = True
            perfil.save()
        huespedes_creados.append(user)

    # --- 3. CREAR 100 PROPIEDADES CON IMÁGENES ---
    tipos = ["Cuarto amueblado", "Depa compartido", "Estudio privado", "Habitación económica", "Loft moderno", "Casa completa (compartida)"]
    zonas = [
        "cerca de la Universidad Tecnológica de Jalisco", "en Tlaquepaque Centro", "en Zona Chapultepec", 
        "en Colonia Americana", "cerca de CUCEI", "en Zapopan Centro", "cerca del Tren Ligero L3", 
        "en Providencia", "en Santa Tere", "cerca de Plaza del Sol", "cerca de la Normal"
    ]
    amenidades_list = [
        "WiFi, Agua, Luz, Gas", "Cocina equipada, WiFi de alta velocidad", 
        "Servicios incluidos, Gym en edificio", "Estacionamiento, WiFi, Seguridad 24/7", 
        "Solo WiFi y Agua (luz aparte)", "Amueblado al 100%, incluye limpieza semanal"
    ]

    propiedades_creadas = []
    print("Construyendo 100 propiedades únicas (asignando fotos 1.jpg a 100.jpg)...")
    
    for i in range(1, 101):
        tipo = random.choice(tipos)
        zona = random.choice(zonas)
        precio = random.randint(25, 85) * 100 
        
        prop, created = Propiedad.objects.get_or_create(
            titulo=f"{tipo} {zona} #{i}",
            defaults={
                'anfitrion': random.choice(anfitriones_creados),
                'descripcion': f"Excelente {tipo.lower()} ubicado estratégicamente {zona}. Cuenta con todo lo necesario para tu estancia. Ideal para estudiantes y profesionistas.",
                'direccion': f"Calle Ficticia {random.randint(100, 999)}, ZMG",
                'precio': precio,
                'amenidades': random.choice(amenidades_list),
                'disponible': True,
                # AQUÍ ESTÁ LA MAGIA DE LAS IMÁGENES:
                'imagen': f'propiedades/{i}.jpg' 
            }
        )
        propiedades_creadas.append(prop)

    # --- 4. CREAR RESERVAS Y RESEÑAS ALEATORIAS ---
    hoy = timezone.now().date()
    estados_reserva = ['pagada', 'finalizada', 'cancelada', 'pendiente']
    comentarios = [
        "Excelente lugar, me quedó súper cerca de la escuela.", 
        "El anfitrión resolvió mis dudas rápido. Todo muy limpio.", 
        "La zona es muy tranquila, el internet fallaba un poco pero bien.", 
        "Estuve 6 meses y me sentí como en casa, muy recomendado.",
        "Justo lo que necesitaba por el precio. La cama es cómoda.",
        "Un poco ruidoso en las mañanas, pero en general buena experiencia."
    ]

    contador_reservas = 0
    contador_resenas = 0

    print("Generando el caos de reservas y reseñas...")
    for propiedad in propiedades_creadas:
        num_reservas = random.randint(0, 12)
        
        for _ in range(num_reservas):
            huesped_random = random.choice(huespedes_creados)
            dias_duracion = random.randint(30, 180) 
            hace_cuanto = random.randint(5, 365) 
            
            fecha_inicio = hoy - timedelta(days=hace_cuanto)
            fecha_fin = fecha_inicio + timedelta(days=dias_duracion)
            
            precio_diario = float(propiedad.precio) / 30
            total_calculado = precio_diario * dias_duracion

            estado_rand = random.choice(estados_reserva)

            reserva = Reserva.objects.create(
                propiedad=propiedad,
                huesped=huesped_random,
                fecha_inicio=fecha_inicio,
                fecha_fin=fecha_fin,
                total=round(total_calculado, 2),
                estado=estado_rand
            )
            contador_reservas += 1

            if reserva.estado in ['pagada', 'finalizada'] and random.random() > 0.3:
                Resena.objects.create(
                    propiedad=propiedad,
                    autor=huesped_random,
                    calificacion=random.choices([3, 4, 5], weights=[10, 40, 50])[0], 
                    comentario=random.choice(comentarios)
                )
                contador_resenas += 1

    print("="*50)
    print("🎉 MIGRACIÓN DE DATOS FINALIZADA 🎉")
    print(f"🏠 Propiedades creadas: {len(propiedades_creadas)}")
    print(f"📅 Reservas totales: {contador_reservas}")
    print(f"⭐ Reseñas publicadas: {contador_resenas}")
    print("="*50)

if __name__ == '__main__':
    poblar_base_de_datos()