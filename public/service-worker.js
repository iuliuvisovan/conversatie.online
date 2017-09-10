self.isWindowFocused = true;

self.addEventListener('push', event => {
    var message = event.data.json();

    // if (message.socketId == self.socketId)
    //     return;

    const title = message.name;
    const options = {
        body: message.messageText,
        icon: 'https://www.conversatie.online/img/logo_' + message.color.slice(1) + '.png?v=2',
        badge: 'https://www.conversatie.online/img/logo_' + message.color.slice(1) + '.png?v=2'
    };

    event.waitUntil(self.registration.showNotification(title, options));
});

self.onmessage = function (msg) {
    console.log('received new focus value!: ' + msg.data.value);
    if (msg.data.name == 'windowFocus')
        self.isWindowFocused = msg.data.value;
    if (msg.data.name == 'socketInit')
        self.socketId = msg.data.value;

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