var socket = io();

//The input from where all chat messages are send
var $inputMessage = $('#inputMessage');

//The <ul> list of messages
var $messageList = $('#messages');

//When window is not on focus, this counter will increase with each message
var unseenMessageCount = 0;

//Toggled at $(window).focus() / blur()
var isWindowFocused = true;

//Socket ID of the last message source user
var lastMessageSenderId = '';

//Subject/room/topic chosen by the user
var userTopic = 'start';

//Username
var userName = '';

//Color of the user
var userColor = '';
var lastSentMessage = '';
var lastWriteEventDispatchTimestamp = new Date();
lastWriteEventDispatchTimestamp.setSeconds(new Date().getSeconds() - 5);
var removeWritingTimeout;
var chatMessageSound = new Audio('/sounds/chatMessage.mp3');
var applicationServerPublicKey = "BMEi_ez0hgDxewidO83qBFenXDfkie8kQmfPnj1AJBsZ9EqgywI5Oo3yK5i6Xp0DMYlHNCEBvF0ayUk2f1PUsD0";
chatMessageSound.loop = false;

window.onbeforeunload = function () {
    return "I am a message";
};

$(document).ready(() => {
    // managePwa();
    loadIframeApi();
    handleWindowFocus();
    getUserName();

    ga('set', 'userId', socket.id);
    $inputMessage.focus();
    socket.emit('check-in', JSON.stringify({
        userName,
        userTopic
    }));
    ga('send', 'event', 'Application', 'join', userName);

    handleJoinEvent();
    handleOnlineUsersUpdateEvent();
    handleActiveEvent();
    handleWriteEvent();
    handleChatMessageEvent();
    handleSyncMediaEvent();
    handleLeaveEvent();
    handleOptions();
    fixKeyboardOpen();
    handleAccessLastMessage();
});


//Event handlers
{
    function handleOnlineUsersUpdateEvent() {
        socket.on('online-users-update', msg => {
            var onlineUsers = JSON.parse(msg);

            var $onlineUserList = $(".online-users-list");
            $(".online-user").remove();

            onlineUsers
                .sort((a, b) => a.lastMessageSecondsAgo > b.lastMessageSecondsAgo ? 1 : -1)
                .forEach(onlineUser => {
                    $onlineUserList.append(
                        $("<span>")
                        .addClass('online-user')
                        .css('background', onlineUser.color)
                        .css('float', onlineUser.socketId.split('#')[1] == socket.id ? 'left' : '')
                        .css('text-decoration', onlineUser.socketId.split('#')[1] == socket.id ? 'underline' : '')
                        .css('cursor', onlineUser.socketId.split('#')[1] == socket.id ? 'pointer' : 'default')
                        .on('click', onlineUser.socketId.split('#')[1] == socket.id ? changeUserName : undefined)
                        .attr('title', 'Schimbă-ți numele')
                        .text(onlineUser.name)
                    );
                });
        });
    }

    function handleJoinEvent() {
        socket.on('join', msg => {
            var messageObject = JSON.parse(msg);

            if (!messageObject.oldName) {
                var messageText = messageObject.messageText;
                if (messageObject.socketId == socket.id && userTopic != 'start')
                    messageText = `#${userTopic} - ` + messageText;
                var spanMessageText = $('<span>').addClass('join-text').text(messageText);
                var spanMessageAuthor = $('<span>')
                    .addClass('join-author')
                    .text(messageObject.name + '!');
            } else {
                var spanMessageAuthorOld = $('<span>').addClass('join-author-old').text(messageObject.oldName);
                var spanMessageText = $('<span>').addClass('join-text').text(messageObject.messageText);
                var spanMessageAuthor = $('<span>').addClass('join-author').text(messageObject.name);
            }

            if (messageObject.socketId == socket.id) {
                if (!spanMessageAuthorOld)
                    $messageList.children().remove();
                $messageList
                spanMessageAuthor
                    .on('click', changeUserName)
                    .attr('title', 'Schimbă-ți numele');

                $('#options').css('color', messageObject.color);
                $('#inputSend').css('border-color', messageObject.color);
                $("meta[name='theme-color']").attr('content', messageObject.color);
                userColor = messageObject.color;
                $('#favicon').attr('href', 'img/logo_' + userColor.slice(1) + '.png');
            }
            var $joinLi = $('<li>')
                .addClass('join')
                .addClass(messageObject.socketId == socket.id ? 'me' : '')
                .css('border-color', messageObject.color)
                .css('color', messageObject.color)
                .append(spanMessageAuthorOld)
                .append(spanMessageText)
                .append(spanMessageAuthor);

            $joinLi.addClass('just-sent');
            $messageList.append($joinLi);
            setTimeout(() => {
                $joinLi.removeClass('just-sent');
            }, 0);
            fixScroll();
        });
    }

    function handleActiveEvent() {
        socket.on('i-am-active', (msg) => {
            msg = JSON.parse(msg);

            //Don't treat me as a person who saw the message
            if (msg.socketId == socket.id)
                return;

            //Only track seen for my messages
            if (socket.id != lastMessageSenderId)
                return;

            $(".users-who-saw").append(
                $("<div>")
                .addClass('user-who-saw')
                .css('background', msg.color));
        });
    }

    function handleWriteEvent() {
        socket.on('writing', (msg) => {

            var messageObject = JSON.parse(msg);

            if (messageObject.socketId != lastMessageSenderId) {
                var spanMessageAuthor = $('<span>')
                    .addClass('message-author')
                    .text(messageObject.socketId == socket.id ?
                        'Tu' : messageObject.name);
            }

            var $writingLi = $('<li>')
                .attr('data-sender-socketid', messageObject.socketId)
                .addClass('writing');
            var spanMessageText = $('<span>')
                .addClass('message-text')
                .css('color', messageObject.color)
                .text('...');

            $writingLi.css('border-color', messageObject.color)
            var currentDate = new Date();
            var currentDateString = `${currentDate.getHours().toString().padStart(2, '0')}:${currentDate.getMinutes().toString().padStart(2, '0')}:${currentDate.getSeconds().toString().padStart(2, '0')}`;
            if (messageObject.socketId == lastMessageSenderId) {
                $writingLi.addClass('same-sender');
            }

            if (messageObject.socketId == socket.id) {
                $writingLi.addClass('mine');
            }
            $writingLi.append(spanMessageAuthor)
            $writingLi.append(spanMessageText);
            if (messageObject.socketId == socket.id) {
                $writingLi.append($('<span>')
                    .addClass('message-time-individual')
                    .text(currentDateString));
            }

            if (messageObject.socketId != socket.id &&
                !$(".writing[data-sender-socketid='" + messageObject.socketId + "']").length) {
                $writingLi.addClass('just-sent');
                $messageList.append($writingLi);
                setTimeout(() => {
                    $writingLi.removeClass('just-sent');
                }, 0);
            }

            clearInterval(removeWritingTimeout);
            removeWritingTimeout = setTimeout(() => {
                $(".writing[data-sender-socketid='" + messageObject.socketId + "']").remove();
            }, 3000);

            fixScroll();
        });
    }

    function handleChatMessageEvent() {
        socket.on('chat message', msg => {
            var messageObject = JSON.parse(msg);
            if (messageObject.socketId != lastMessageSenderId) {
                var spanMessageAuthor = $('<span>')
                    .addClass('message-author')
                    .text(messageObject.socketId == socket.id ?
                        'Tu' : messageObject.name);
            }
            var messageContent = replaceWithMultiMedia(
                messageObject.messageText,
                messageObject.messageUnixTime);
            var youtubeVideoId = $(messageContent).attr('data-youtube-url');
            if (youtubeVideoId) {
                createYoutubeVideo($(messageContent).attr('id'), youtubeVideoId);
                ga('send', 'event', 'Message', 'sendVideo', youtubeVideoId);
            }


            var $spanMessageText = $('<span>')
                .addClass('message-text')
                .addClass(youtubeVideoId ? 'youtube-video' : '')
                .css('background', messageObject.color)
                .html(messageContent);

            var $messageLi = $('<li>');
            $messageLi.css('border-color', messageObject.color)
            if (!isWindowFocused)
                $messageLi.addClass('not-seen');
            var currentDate = new Date();
            var currentDateString = `${currentDate.getHours().toString().padStart(2, '0')}:${currentDate.getMinutes().toString().padStart(2, '0')}:${currentDate.getSeconds().toString().padStart(2, '0')}`;
            if (messageObject.socketId == lastMessageSenderId) {
                $messageLi.addClass('same-sender');
            }

            $(".users-who-saw").children().remove();

            if (messageObject.socketId == socket.id) {
                $messageLi.addClass('mine');
            } else {
                chatMessageSound.play();
                $messageLi.append($('<span>')
                    .addClass('message-time-individual')
                    .text(currentDateString));
            }
            $messageLi.append(spanMessageAuthor)
            $messageLi.append($spanMessageText);
            if (messageObject.socketId == socket.id) {
                $messageLi.append($('<span>')
                    .addClass('message-time-individual')
                    .text(currentDateString));
            }

            $messageLi.addClass('just-sent');
            $messageList.append($messageLi);
            setTimeout(() => {
                $messageLi.removeClass('just-sent');
            }, 0);

            fixScroll();
            lastMessageSenderId = messageObject.socketId;

            if (!isWindowFocused) {
                unseenMessageCount++;
                if (userTopic.toLowerCase().trim() != 'start')
                    $('title').text('(' + unseenMessageCount + ') #' + userTopic + '- Conversează. Online!');
                else
                    $('title').text('(' + unseenMessageCount + ') Conversează. Online! - www.conversatie.online');
                $('#favicon').attr('href', 'img/logo_' + messageObject.color.slice(1) + '.png');
            } else {
                socket.emit('i-am-active');
            }

            if ($(".writing[data-sender-socketid='" + messageObject.socketId + "']").length) {
                clearInterval(removeWritingTimeout);
                $(".writing[data-sender-socketid='" + messageObject.socketId + "']").remove();
                lastWriteEventDispatchTimestamp.setSeconds(new Date().getSeconds() - 5);
                return;
            }
        });
    }

    function handleSyncMediaEvent() {
        socket.on('sync-media', message => {
            message = JSON.parse(message);
            if (message.socketId == socket.id)
                return;
            var messageId = message.messageId;
            var currentTime = message.currentTime;
            var playerState = message.playerState;
            syncYoutubePlayerById(messageId, currentTime, playerState);
        });
    }

    function handleLeaveEvent() {
        socket.on('leave', msg => {
            var messageObject = JSON.parse(msg);
            var spanMessageAuthor = $('<span>').addClass('join-author').text(messageObject.name);
            var spanMessageText = $('<span>').addClass('join-text').text(messageObject.messageText);
            var $leaveLi = $('<li>')
                .addClass('leave')
                .addClass('just-sent')
                .css('border-color', messageObject.color)
                .css('color', messageObject.color)
                .append(spanMessageAuthor)
                .append(spanMessageText);

            $messageList.append($leaveLi);
            setTimeout(() => {
                $leaveLi.removeClass('just-sent');
            }, 0);
            fixScroll();
            ga('send', 'event', 'Application', 'leave', messageObject.name);
        });
    }
}


//User actions
{

    function changeUserName() {
        getUserName(true);
        socket.emit('check-in', JSON.stringify({
            userName,
            userTopic
        }));
        $('#inputMessage').focus();
    }

    function changeUserTopic() {
        userTopic = '';
        getUserTopic();
        if (!userName)
            userName = localStorage.userName;
        socket.emit('check-in', JSON.stringify({
            userName,
            userTopic
        }));
        ga('send', 'event', 'Application', 'joinTopic', userTopic);
        $('#inputMessage').focus();
    }

    function getUserName(isNameChange) {
        userName = localStorage.userName;
        if (isNameChange)
            userName = prompt("Cum te cheamă? (Cancel sau Esc pentru alt nume șmecher)", userName);
        else if (!userName) {
            do {
                userName = prompt("Cum te cheamă? (Cancel sau Esc pentru alt nume șmecher)", randomNames[new Date().getTime() % 38]);
            } while (!userName);
        }
        if (userName)
            localStorage.userName = userName;
        else
            userName = localStorage.userName;
    }

    function getUserTopic() {
        var promptText = "Despre ce vrei sa vorbesti? (Lasă gol pentru a reveni la pagina de start.)";
        userTopic = prompt(promptText, userTopic);

        if (!userTopic)
            userTopic = 'start';
        else
            userTopic = userTopic.toLowerCase().trim().replace(/[^\w]/g, '');
        if (userTopic.trim() != 'start') {
            $('.room-name').text('#' + userTopic);
            $('title').html('[' + userTopic + '] Conversează. Online!');
        } else {
            $('.room-name').text('');
            $('title').html('Conversează. Online!');
        }

    }

    function handleAccessLastMessage() {
        $inputMessage.keyup(e => {
            if (e.keyCode == 38) {
                $inputMessage.val(lastSentMessage);
            }
            if (e.keyCode == 40) {
                $inputMessage.val('');
            }
        });
    }

    function iAmWriting() {
        if (Math.abs(new Date().getSeconds() - lastWriteEventDispatchTimestamp.getSeconds()) > 1) {
            socket.emit('i am writing');
            lastWriteEventDispatchTimestamp = new Date();
        }
    }

    function sendMessage() {
        var message = $('<div/>').html($inputMessage.val()).text().trim();
        if (message) {
            if (message.length > 300)
                return;
            $inputMessage.val('');
            socket.emit('chat message', message);
            lastSentMessage = message;
            ga('send', 'event', 'Message', 'send', message);
        }
        $('#inputMessage').focus();
        $('#inputSend').addClass('opaque');
    }

    function handleOptions() {
        $("#options").change(function () {
            switch (this.value) {
                case 'change-name':
                    changeUserName();
                    break;
                case 'change-topic':
                    changeUserTopic();
                    break;
            }
            $("#options").val(0);
        });
    }
}

//UI & behavior
{

    function handleWindowFocus() {
        $(window).focus(() => {
            if (unseenMessageCount) {
                $("li:not(.not-seen)").addClass('seen-on-focus');
                $(".not-seen").removeClass('not-seen');
                setTimeout(() => {
                    $("li:not(.not-seen)").removeClass('seen-on-focus');
                }, 7000);
                socket.emit('i-am-active');
            }

            isWindowFocused = true;
            unseenMessageCount = 0;

            $('#favicon').attr('href', 'img/logo_' + userColor.slice(1) + '.png');

            if (userTopic.toLowerCase().trim() != 'start')
                $('title').html('#' + userTopic + ' - Conversează. Online! | www.conversatie.online');
            else
                $('title').html('Conversează. Online! - www.conversatie.online');
            $('#inputMessage').focus();
        });
        $(window).blur(() => isWindowFocused = false);
        $("#inputMessage").keyup(e => {
            if ($("#inputMessage").val().trim().length)
                $('#inputSend').removeClass('opaque');
            else
                $('#inputSend').addClass('opaque');

            if (e.keyCode == 13) {
                sendMessage();
                return false;
            }
        });
    }

    function fixScroll() {
        setTimeout(() => {
            $(".messages")[0].scrollTop = $(".messages")[0].scrollHeight;
        }, 100);
    }

    function fixKeyboardOpen() {
        $(window).on('resize', fixScroll);
    }
}

//Progressive web app management
{

    function managePwa() {
        initServiceWorker()
            .then(initialiseUI);
    }

    var initServiceWorker = () => new Promise((resolve, reject) => {
        if (!'serviceWorker' in navigator) {
            alert("Congrats! Your browser doesn't support service worker! In 2017!");
            return;
        }
        navigator.serviceWorker
            .register('service-worker.js', {
                scope: ' '
            })
            .then(swReg => {
                swRegistration = swReg;
                console.log('Houston, we have a registered Service Worker! 😱');
                resolve();
            });
    });

    var initialiseUI = () => new Promise((resolve, reject) => {
        swRegistration.pushManager.getSubscription()
            .then(subscription => {
                isSubscribed = !(subscription === null);
                if (!isSubscribed || Notification.permission === 'denied') {
                    $("#btnAddPwa").show();
                }
                resolve();
            });
    });

    function subscribeUser() {
        const applicationServerKey = urlB64ToUint8Array(applicationServerPublicKey);
        swRegistration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: applicationServerKey
            })
            .then(subscription => {
                console.log('User is subscribed.');

                localStorage.userId = socket.id;
                socket.emit('subscribe', JSON.stringify({
                    pushMessageSubscription: subscription,
                    userId: socket.id
                }));

                isSubscribed = true;

                // window.location.reload();
            });
    }

    function urlB64ToUint8Array(base64String) {
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
}