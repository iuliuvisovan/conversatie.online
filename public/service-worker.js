self.addEventListener('push', function (event) {
    const title = 'PENIS DE ARMADILLO';
    const options = {
        body: 'Da, ai citit corect. Penis de armadillo.',
        icon: 'https://ae01.alicdn.com/kf/HTB1TGiKKXXXXXcLXpXXq6xXFXXXI/Stag-font-b-Night-b-font-Halloween-Inflatable-Willy-Adult-Fancy-Dress-Costume-Penis-Cosplay-Outfit.jpg',
        badge: 'https://ae01.alicdn.com/kf/HTB1TGiKKXXXXXcLXpXXq6xXFXXXI/Stag-font-b-Night-b-font-Halloween-Inflatable-Willy-Adult-Fancy-Dress-Costume-Penis-Cosplay-Outfit.jpg'
    };

    event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', function (event) {
    console.log('[Service Worker] Notification click Received.');

    event.notification.close();
});