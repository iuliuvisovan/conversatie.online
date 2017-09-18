self.addEventListener('install', event => {
    // The promise that skipWaiting() returns can be safely ignored.
    self.skipWaiting();
});
self.addEventListener('activate', event => {
    self.clients.claim();
});
self.addEventListener('fetch', event => {
    //Happy, Mr. Archibald?
});

self.addEventListener('push', async function (event) {
    event.waitUntil(async function () {
        var message = event.data.json();
        console.log('Received message!');
        var anyWindowHasFocus = (await clients.matchAll({
            type: 'window'
        })).some(x => x.focused);

        // If has an active window or message is received by sender
        // if (anyWindowHasFocus || message.socketId == self.socketId) {
        //     return;
        // }


        console.log('Everything is cool, showing notification!: ' + message.messageText);
        const title = message.name;
        const options = {
            body: message.messageText,
            tag: 'conversatie.online',
            icon: 'https://www.conversatie.online/img/logo_' + message.color.slice(1) + '.png?v=2',
            badge: 'https://www.conversatie.online/img/logo_' + message.color.slice(1) + '.png?v=2'
        };
        return self.registration.showNotification(title, options);
    }());
});

self.onmessage = (msg) => {
    if (msg.data.name == 'socketInit') {
        console.log('Received new socket id: ' + msg.data.value);
        self.socketId = msg.data.value;
    }
}


self.addEventListener('notificationclick', event => {
    console.log('[Service Worker] Notification click Received.');

    event.notification.close();

    const url = 'https://www.conversatie.online';

    const urlToOpen = new URL(url, self.location.origin).href;

    event.waitUntil(async function () {
        const client = (await clients.matchAll({
                type: 'window'
            }))
            .find(x => (x.url.includes(urlToOpen) && 'focus' in x));

        if (client)
            client.focus();
        else if (clients.openWindow)
            return clients.openWindow(urlToOpen);
    }());
});