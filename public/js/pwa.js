//Progressive web app management
var share = async() => {
    await navigator.share({
        title: 'Conversează. Online!',
        text: 'Nu sta deoparte. Hai și tu în conversație!',
        url: 'https://www.conversatie.online',
    });
    console.log('Successful share');
}


var initPwa = () => new Promise((resolve, reject) => {
    initServiceWorker()
        .then(supportsServiceWorker => {
            //If doesns't supoprt.. just treat it as subscribed.. fml
            if (!supportsServiceWorker)
                resolve(true);

            //Else, act like it exists everywhere, ask for permision and tell the user the app won't work without it
            else
                initialiseUI()
                .then(resolve);
        });
});


var initServiceWorker = () => new Promise((resolve, reject) => {
    if (!'serviceWorker' in navigator) {
        alert("Congrats! Your browser doesn't support service worker! In 2017!");
        resolve(false);
        return;
    }
    navigator.serviceWorker
        .register('service-worker.js?v=' + +new Date(), {
            scope: ' '
        })
        .then(swReg => {
            swRegistration = swReg;
            console.log('Houston, we have a registered Service Worker! 😱');
            resolve(true);
        });
});

var initialiseUI = () => new Promise((resolve, reject) => {
    swRegistration.pushManager.getSubscription()
        .then(subscription => {
            isSubscribed = !(subscription === null);
            if (subscription)
                userId = subscription.endpoint;
            if (isMobileDevice()) {
                resolve(true);
                return;
            }
            if (!isSubscribed || Notification.permission === 'denied') {
                $("#pwaBar").removeClass('no-video');
            }
            resolve(isSubscribed);
        });
});

var subscribeUser = () => {
    const applicationServerKey = urlB64ToUint8Array(applicationServerPublicKey);
    swRegistration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: applicationServerKey
        })
        .then(subscription => {
            console.log('User is subscribed.');

            socket.emit('subscribe', JSON.stringify({
                pushMessageSubscription: subscription,
                userId: subscription.endpoint
            }));

            isSubscribed = true;
            window.location.reload();
        });
}

var urlB64ToUint8Array = (base64String) => {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
        .replace(/\-/g, '+')
        .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}