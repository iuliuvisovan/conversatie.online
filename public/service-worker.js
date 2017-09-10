self.addEventListener('push', event => {
    var message = event.data.json();

    const title = message.name;
    const options = {
        body: message.messageText,
        icon: 'https://www.conversatie.online/img/logo_' + message.color.slice(1) + '.png?v=2',
        badge: 'https://www.conversatie.online/img/logo_' + message.color.slice(1) + '.png?v=2'
    };

    event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', function (event) {
    console.log('[Service Worker] Notification click Received.');

    event.notification.close();
});