// Chantli/frontend_chantli/public/custom-sw.js

self.addEventListener('push', function(event) {
    // Si el servidor mandó datos, los extraemos
    const data = event.data ? event.data.json() : {};
    
    // OJO AQUÍ: Cambiamos data.title por data.head (así lo manda Django)
    const title = data.head || 'Nueva Notificación de Chantli';
    const options = {
        body: data.body || 'Tienes una actualización.',
        icon: '/pwa-192x192.png',
        badge: '/pwa-192x192.png',
        vibrate: [200, 100, 200],
        data: data.url || '/' 
    };

    event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', function(event) {
    event.notification.close();
    event.waitUntil(
        clients.openWindow(event.notification.data)
    );
});