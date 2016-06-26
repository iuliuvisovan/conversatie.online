var socket = io();

var randomNames = ["Demi Lopato", "Emil Ciorap", "Anton Pat", "Paula Selinge", "Lady Gag", "Organ Freeman", "Brad Pittă",
    "Hug Jackman", "Megan Ox"];
var $messageBox = $('#inputMessage');
var $messageList = $('#messages');
var newMessages = 0;
var isWindowFocused = true;

$(document).ready(function () {
    $(window).focus(function () {
        isWindowFocused = true;
        newMessages = 0;
        $('title').html('d3i');
    });
    $(window).blur(function () {
        isWindowFocused = false;
    });
    $("#inputMessage").keyup(function (e) {
        if (e.keyCode == 13) {
            $messageBox.val() && socket.emit('chat message', $messageBox.val());
            $messageBox.val('');
            return false;
        }
    });
    $messageBox.focus();
    do {
        var person = prompt("Cum te cheamă? (Cancel sau Esc pentru alt nume șmecher)", randomNames[new Date().getTime() % 9]);
    } while (!person);
    // var person = 'Anuță';
    socket.emit('check-in', person);

    socket.on('join', function (msg) {
        var messageObject = JSON.parse(msg);
        var spanMessageWriter = $('<span>').addClass('join-author').text(messageObject.name);
        var spanMessageText = $('<span>').addClass('join-text').text(messageObject.messageText);
        $messageList.append($('<li>').addClass('join').addClass(messageObject.isFemale ? 'girl' : 'guy').append(spanMessageWriter).append(spanMessageText));
        $messageList.scrollTop($messageList[0].scrollHeight);
    });

    socket.on('chat message', function (msg) {
        var messageObject = JSON.parse(msg);
        var spanMessageWriter = $('<span>').addClass('message-author').text(messageObject.name);
        var spanMessageText = $('<span>').addClass('message-text').text(messageObject.messageText);
        $messageList.append($('<li>').append(spanMessageWriter).append(spanMessageText));
        $messageList.scrollTop($messageList[0].scrollHeight);
        if(!isWindowFocused) {
            newMessages++;
            $('title').html('(' + newMessages + ') d3i');
        }
    });

    socket.on('leave', function (msg) {
        var messageObject = JSON.parse(msg);
        var spanMessageWriter = $('<span>').addClass('join-author').text(messageObject.name);
        var spanMessageText = $('<span>').addClass('join-text').text(messageObject.messageText);
        $messageList.append($('<li>').addClass('leave').addClass(messageObject.isFemale ? 'girl' : 'guy').append(spanMessageWriter).append(spanMessageText));
        $messageList.scrollTop($messageList[0].scrollHeight);
    });
});

