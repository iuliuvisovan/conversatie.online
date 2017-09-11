self.isWindowFocused = true;

self.addEventListener('install', function (event) {
    // The promise that skipWaiting() returns can be safely ignored.
    self.skipWaiting();
});

self.addEventListener('push', event => {
    var message = event.data.json();
    console.log('Received message!');
    console.log(message);

    //If has an active window or message is received by sender
    if (self.isWindowFocused || message.socketId == self.socketId) {
        console.log('Window focused: ' + self.isWindowFocused);
        console.log('I am the sender: ' + (message.socketId == self.socketId));
        return;
    }

    console.log('Eveyrthing is cool, showing notification!: ' + message.messageText);

    const title = message.name;
    const options = {
        body: message.messageText,
        tag: 'conversatie.online',
        icon: 'https://www.conversatie.online/img/logo_' + message.color.slice(1) + '.png?v=2',
        badge: 'https://www.conversatie.online/img/logo_' + message.color.slice(1) + '.png?v=2'
    };

    event.waitUntil(self.registration.showNotification(title, options));
});

self.onmessage = function (msg) {
    if (msg.data.name == 'windowFocus') {
        console.log('received new window focus:' + msg.data.value);
        self.isWindowFocused = msg.data.value;
    }
        
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
    const promiseChain = clients.matchAll({
            type: 'window',
            includeUncontrolled: true
        })
        .then((windowClients) => {
            let matchingClient = null;

            for (let i = 0; i < windowClients.length; i++) {
                const windowClient = windowClients[i];
                if (windowClient.url === urlToOpen) {
                    matchingClient = windowClient;
                    break;
                }
            }

            if (matchingClient) {
                return matchingClient.focus();
            } else {
                return clients.openWindow(urlToOpen);
            }
        });

    event.waitUntil(promiseChain);
});