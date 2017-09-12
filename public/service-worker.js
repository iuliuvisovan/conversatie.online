self.isWindowFocused = true;

self.addEventListener('install', function (event) {
    // The promise that skipWaiting() returns can be safely ignored.
    self.skipWaiting();
});
self.addEventListener('activate', function (event) {
    // The promise that skipWaiting() returns can be safely ignored.
    self.clients.claim();
});

self.addEventListener('push', async function(event) {
    var message = event.data.json();
    console.log('Received message!');
    console.log(message);
    var anyWindowHasFocus = (await clients.matchAll({
        type: 'window'
    })).some(x => x.focused);

    console.log('any focues window available: ', anyWindowHasFocus);
    //If has an active window or message is received by sender
    // if (self.isWindowFocused || message.socketId == self.socketId) {
    //     console.log('Window focused: ' + self.isWindowFocused);
    //     console.log('I am the sender: ' + (message.socketId == self.socketId));
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
});

self.onmessage = function (msg) {
    // if (msg.data.name == 'windowFocus') {
    //     console.log('received new window focus:' + msg.data.value);
    //     self.isWindowFocused = msg.data.value;
    // }

    if (msg.data.name == 'socketInit') {
        console.log('received new socket id :' + msg.data.value);
        self.socketId = msg.data.value;
    }
}


self.addEventListener('notificationclick', function (event) {
    console.log('[Service Worker] Notification click Received.');

    event.notification.close();

    const url = 'https://www.conversatie.online';

    const urlToOpen = new URL(url, self.location.origin).href;

    event.waitUntil(async function () {
        const client = (await clients.matchAll({
                type: 'window'
            }))
            .find(x => (x.urlToOpen === urlToOpen && 'focus' in x));

        if (client)
            client.focus();
        else if (clients.openWindow)
            return clients.openWindow(urlToOpen);
    }());
});