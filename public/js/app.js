var socket = io(), //Main socket.io object
    isAppInitiated = false, //Only changes state once, on the first 'push' event received
    isWindowFocused = true, //Toggled at $(window).focus() / blur()
    unseenMessageCount = 0, //When window is not on focus, this counter will increase with each message
    lastMessageUserId = '', //Socket ID of the last message source user
    userRoom = window.location.hash.slice(1) //Subject/room chosen by the user
    ||
    localStorage.room ||
    "start",
    userName = '', //Username
    userColor = '', //Color of the user
    lastSentMessage = '', //Current user's last sent message, so he can access it using the up arrow
    lastWriteEventDate = new Date(), //Timestamp of the last 'write' event from current user (for throttling purposes)
    intervalRemoveWriting, //Reference to the setTimeout that removes the 'writing' indicator
    chatMessageSound = //Sound played when receiving a chat message
    new Audio('/sounds/chat-message.mp3'),
    youtubeVideoSound = //Sound played when receiving a youtube video
    new Audio('/sounds/youtube-video.mp3'),
    chatLeaveSound = //Sound played when receiving a youtube video
    new Audio('/sounds/chat-leave.mp3'),
    chatJoinSound = //Sound played when receiving a youtube video
    new Audio('/sounds/chat-join.mp3'),
    applicationServerPublicKey = //Public key of app, to be used for by PWA subscription requests
    "BMEi_ez0hgDxewidO83qBFenXDfkie8kQmfPnj1AJBsZ9EqgywI5Oo3yK5i6Xp0DMYlHNCEBvF0ayUk2f1PUsD0",
    lastPlayingPlayer, //Reference to the last video that played
    userId = (+new Date()).toString(); //ID of each user (overwritten with subscriptionEndpoint if valid SW subscription found)

updateUserRoom();

//All UI is adapted only after YT player is loaded
loadIframeApi();


//Called when Iframe API is loaded & ready
var onYouTubeIframeAPIReady = async() => {
    const isUserSubscribed = await initPwa();

    //What happens not matter if subscribed or not?
    setupShareMethod();

    //What happens if he's not subscribed?
    if (!isUserSubscribed) {
        onUserNotSubscribed();
        return;
    }

    //What happens only if he's subscribed?
    onUserSubscribed();

    //initApp() will be called at 'check in' event response (first 'join' event) 
    //since we want to make sure our var socket = io() variable has the id property correctly populated from the server
}

var onUserNotSubscribed = () => {
    $("#inputMessage, #options").css('pointer-events', 'none');
    $("#options").css('color', '#a3ce71');
    $(".bar, .circle").css('background', '#a3ce71');
    $(".loading-indicator").fadeOut();
}

var onUserSubscribed = async() => {
    handleBeforeUnload();
    handleWindowFocus();
    getUserName();

    ga('set', 'userId', userId);
    $("#inputMessage").focus();
    handleSocketEvents();
    socket.emit('check in', JSON.stringify({
        userId,
        userName,
        userRoom: userRoom,
    }));
}

var initApp = () => {
    isAppInitiated = true;

    greetDevs('!');

    ga('send', 'event', 'Application', 'join', userName);

    handleOptions();
    handleImagePaste();
    fixKeyboardOpen();
    handleAccessLastMessage();
    setupShareMethod();
    handleHashChange();

    //Tell the service worker who I am
    navigator.serviceWorker.ready.then(registration => {
        $(".loading-indicator").fadeOut();
        navigator.serviceWorker.controller.postMessage({
            name: 'userInit',
            value: userId
        });
    });
}