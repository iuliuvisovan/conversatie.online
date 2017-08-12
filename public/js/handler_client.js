//TODO
//YT link share
//File send
//Message search

var socket = io();

var $messageBox = $('#inputMessage');
var $messageList = $('#messages');
var newMessages = 0;
var isWindowFocused = true;
var lastMessageSenderId = '';
var personName = '';
var personColor = '';
var chatMessageSound = new Audio('/sounds/chatMessage.mp3');
chatMessageSound.loop = false;

window.onbeforeunload = function () {
    socket.emit('disconnect');
    return "I am a message";
};

$(document).ready(() => {
    handleWindowFocus();
    getPersonName();

    $messageBox.focus();
    $messageBox.attr('placeholder', 'Ce le scriem ăstora, ' + personName + '?');
    socket.emit('check-in', personName);

    handleJoinEvent();
    handleChatMessageEvent();
    handleLeaveEvent();
    handleOptions();
});

function handleLeaveEvent() {
    socket.on('leave', msg => {
        console.log('leave');
        var messageObject = JSON.parse(msg);
        var spanMessageAuthor = $('<span>').addClass('join-author').text(messageObject.name);
        var spanMessageText = $('<span>').addClass('join-text').text(messageObject.messageText);
        var leaveLi = $('<li>')
            .addClass('leave')
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
        var spanMessageAuthor = $('<span>')
            .addClass('message-author')
            .text(messageObject.socketId == socket.id ?
                'Tu' : messageObject.name);
        var spanMessageText = $('<span>')
            .addClass('message-text')
            .css('background', messageObject.color)
            .html(replaceWithEmojis(messageObject.messageText));

        console.log(messageObject.color);

        var li = $('<li>');
        li.css('border-color', messageObject.color)
        var currentDate = new Date();
        var currentDateString = `${currentDate.getHours().toString().padStart(2, '0')}:${currentDate.getMinutes().toString().padStart(2, '0')}:${currentDate.getSeconds().toString().padStart(2, '0')}`;
        if (messageObject.socketId == lastMessageSenderId) {
            li.addClass('same-sender');
        }

        if (messageObject.socketId == socket.id) {
            li.addClass('mine');
        } else {
            chatMessageSound.play();
        }
        li.append(spanMessageAuthor)
        li.append(spanMessageText);
        if (messageObject.socketId == socket.id) {
            li.append($('<span>')
                .addClass('message-time-individual')
                .text(currentDateString));
        }

        $messageList.append(li);
        fixScroll();
        lastMessageSenderId = messageObject.socketId;
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
        $messageList.scrollTop($messageList[0].scrollHeight + 50);
    }, 100);
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

            $('.footer').css('border-color', messageObject.color);
            $('#options').css('color', messageObject.color);
        }
        console.log(messageObject.color);
        var joinLi = $('<li>')
            .addClass('join')
            .addClass(messageObject.socketId == socket.id ? 'me' : '')
            .css('color', messageObject.color)
            .append(spanMessageAuthor)
            .append(spanMessageText)
            .append(spanMessageAuthorNew);

        $messageList.append(joinLi);
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
        if (e.keyCode == 13) {
            $messageBox.val() && socket.emit('chat message', $messageBox.val());
            $messageBox.val('');
            return false;
        }
    });
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