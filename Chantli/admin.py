from django.contrib import admin
from django.apps import apps

# 1. Obtienes la configuración de TU aplicación
# IMPORTANTE: Reemplaza 'nombre_de_tu_app' por el nombre real de tu carpeta de la app
app = apps.get_app_config('Chantli')

# 2. Haces un bucle por todos los modelos y los registras
for model_name, model in app.models.items():
    try:
        admin.site.register(model)
    except admin.sites.AlreadyRegistered:
        pass