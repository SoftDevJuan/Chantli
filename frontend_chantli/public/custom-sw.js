// public/custom-sw.js

// 1. Escuchar cuando llega un mensaje Push del servidor
self.addEventListener('push', function(event) {
    // Si el servidor mandó datos, los extraemos
    const data = event.data ? event.data.json() : {};
    
    const title = data.title || 'Nueva Notificación de Chantli';
    const options = {
        body: data.body || 'Tienes una actualización.',
        icon: '/pwa-192x192.png', // Tu logo
        badge: '/pwa-192x192.png', // Icono pequeño monocromático para la barra de estado
        vibrate: [200, 100, 200], // Patrón de vibración del celular
        data: data.url || '/' // ¿A dónde llevamos al usuario si toca la notificación?
    };

    // Le decimos al celular que dibuje la notificación nativa
    event.waitUntil(self.registration.showNotification(title, options));
});

// 2. Escuchar cuando el usuario TOCA la notificación
self.addEventListener('notificationclick', function(event) {
    event.notification.close(); // Cerramos la alerta
    
    // Abrimos la app en la ruta que venía en los datos
    event.waitUntil(
        clients.openWindow(event.notification.data)
    );
});