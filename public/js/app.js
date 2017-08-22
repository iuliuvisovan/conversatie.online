var socket = io();

var $messageBox = $('#inputMessage');
var $messageList = $('#messages');
var newMessages = 0;
var isWindowFocused = true;
var lastMessageSenderId = '';
var personName = '';
var personColor = '';
var lastWriteEventDispatchTimestamp = new Date();
lastWriteEventDispatchTimestamp.setSeconds(new Date().getSeconds() - 5);
var removeWritingTimeout;
var chatMessageSound = new Audio('/sounds/chatMessage.mp3');
var applicationServerPublicKey = "BMEi_ez0hgDxewidO83qBFenXDfkie8kQmfPnj1AJBsZ9EqgywI5Oo3yK5i6Xp0DMYlHNCEBvF0ayUk2f1PUsD0";
chatMessageSound.loop = false;

window.onbeforeunload = function () {
    socket.emit('disconnect');
    return "I am a message";
};

$(document).ready(() => {
    // managePwa();

    handleWindowFocus();
    getPersonName();

    $messageBox.focus();
    socket.emit('check-in', personName);

    handleJoinEvent();
    handleWriteEvent();
    handleChatMessageEvent();
    handleLeaveEvent();
    handleOptions();
    fixKeyboardOpen();
});

function handleLeaveEvent() {
    socket.on('leave', msg => {
        var messageObject = JSON.parse(msg);
        var spanMessageAuthor = $('<span>').addClass('join-author').text(messageObject.name);
        var spanMessageText = $('<span>').addClass('join-text').text(messageObject.messageText);
        var leaveLi = $('<li>')
            .addClass('leave')
            .css('border-color', messageObject.color)
            .css('color', messageObject.color)
            .append(spanMessageAuthor)
            .append(spanMessageText);

        $messageList.append(leaveLi);
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
        var spanMessageText = $('<span>')
            .addClass('message-text')
            .css('background', messageObject.color)
            .html(replaceWithEmojis(messageObject.messageText));

        var $li = $('<li>');
        $li.css('border-color', messageObject.color)
        var currentDate = new Date();
        var currentDateString = `${currentDate.getHours().toString().padStart(2, '0')}:${currentDate.getMinutes().toString().padStart(2, '0')}:${currentDate.getSeconds().toString().padStart(2, '0')}`;
        if (messageObject.socketId == lastMessageSenderId) {
            $li.addClass('same-sender');
        }

        if (messageObject.socketId == socket.id) {
            $li.addClass('mine');
        } else {
            chatMessageSound.play();
        }
        $li.append(spanMessageAuthor)
        $li.append(spanMessageText);
        if (messageObject.socketId == socket.id) {
            $li.append($('<span>')
                .addClass('message-time-individual')
                .text(currentDateString));
        }

        $messageList.append($li);
        fixScroll();
        lastMessageSenderId = messageObject.socketId;

        if ($(".writing[data-sender-socketid='" + messageObject.socketId + "']").length) {
            clearInterval(removeWritingTimeout);
            $(".writing[data-sender-socketid='" + messageObject.socketId + "']").remove();
            lastWriteEventDispatchTimestamp.setSeconds(new Date().getSeconds() - 5);
            return;
        }

        if (!isWindowFocused) {
            newMessages++;
            $('title').html('(' + newMessages + ') d3i');
            var imageNumber = (newMessages >= 8 ? 7 : newMessages);
            $('#favicon').attr('href', 'img/favicon_' + (imageNumber + 1) + '.png');
        }
    });
}

function fixScroll() {
    setTimeout(() => {
        $('.messages')[0].scrollTop = $('.messages')[0].scrollHeight;
    }, 100);
}

function fixKeyboardOpen() {
    $(window).on('resize', fixScroll);
}

function handleJoinEvent() {
    socket.on('join', msg => {
        var messageObject = JSON.parse(msg);

        if (!messageObject.oldName) {
            var spanMessageAuthor = $('<span>').addClass('join-author').text(messageObject.name);
            var spanMessageText = $('<span>').addClass('join-text').text(messageObject.messageText);
        } else {
            var spanMessageAuthor = $('<span>').addClass('join-author-old').text(messageObject.oldName);
            var spanMessageText = $('<span>').addClass('join-text').text(messageObject.messageText);
            var spanMessageAuthorNew = $('<span>').addClass('join-author').text(messageObject.name);
        }

        if (messageObject.socketId == socket.id) {
            (spanMessageAuthorNew || spanMessageAuthor)
            .on('click', changePersonName)
                .attr('title', 'Schimbă-ți numele');

            $('#options').css('color', messageObject.color);
            $('#inputSend').css('border-color', messageObject.color);
        }
        var joinLi = $('<li>')
            .addClass('join')
            .addClass(messageObject.socketId == socket.id ? 'me' : '')
            .css('border-color', messageObject.color)
            .css('color', messageObject.color)
            .append(spanMessageAuthor)
            .append(spanMessageText)
            .append(spanMessageAuthorNew);

        $messageList.append(joinLi);
        fixScroll();
    });
}

function handleWriteEvent() {
    socket.on('user is writing', msg => {

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

        if (!$(".writing[data-sender-socketid='" + messageObject.socketId + "']").length) {
            $messageList.append($writingLi);
        }

        clearInterval(removeWritingTimeout);
        removeWritingTimeout = setTimeout(() => {
            $(".writing[data-sender-socketid='" + messageObject.socketId + "']").remove();
        }, 30000);

        fixScroll();
    });

}

function changePersonName() {
    if (sessionStorage.sessionNameChanges > 3)
        return;
    localStorage.personName = '';
    getPersonName();
    sessionStorage.sessionNameChanges = (+sessionStorage.sessionNameChanges || 0) + 1;
    socket.emit('check-in', personName);
}

function getPersonName() {
    personName = localStorage.personName;
    if (!personName) {
        do {
            personName = prompt("Cum te cheamă? (Cancel sau Esc pentru alt nume șmecher)",
                randomNames[new Date().getTime() % 38]);
        } while (!personName);
        localStorage.personName = personName;
    }
}

function handleWindowFocus() {
    $(window).focus(() => {
        isWindowFocused = true;
        newMessages = 0;
        $('title').html('d3i');
        $('#favicon').attr('href', 'img/favicon_1.png');
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

function IAmWriting() {
    if (Math.abs(new Date().getSeconds() - lastWriteEventDispatchTimestamp.getSeconds()) > 1) {
        socket.emit('i am writing');
        lastWriteEventDispatchTimestamp = new Date();
    }
}

function sendMessage() {
    var message = $messageBox.val();
    if (message) {
        $messageBox.val('');
        socket.emit('chat message', message);
    }
    $('#inputMessage').focus();
    $('#inputSend').addClass('opaque');
}

function handleOptions() {
    $("#options").change(function () {
        switch (this.value) {
            case 'change-name':
                changePersonName();
                break;
        }
        $("#options").val(0);
    });
}

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