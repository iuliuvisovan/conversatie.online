var socket = io();

var randomNames = ["Demi Lopato", "Emil Ciorap", "Anton Pat", "Paula Selinge", "Lady Gag", "Organ Freeman", "Bra Pitt", "John Ravolta", "Hug Jackman", "Megan Ox"];
var $messageBox = $('#inputMessage');
var $messageList = $('#messages');

$(document).ready(function () {
    $("#inputMessage").keyup(function (e) {
        if (e.keyCode == 13) {
            $messageBox.val() && socket.emit('chat message', $messageBox.val());
            $messageBox.val('');
            return false;
        }
    });
    $messageBox.focus();
    do{
        var person = prompt("Cum te cheamă? (Apasă Esc pentru alt nume șmecher)", randomNames[new Date().getTime() % 10]);
    }while(!person);
    // var person = 'Anuță';
    socket.emit('check-in', person);

    socket.on('chat message', function (msg) {
        var messageObject = JSON.parse(msg);
        var spanMessageWriter = $('<span>').addClass('message-author').text(messageObject.name);
        var spanMessageText = $('<span>').addClass('message-text').text(messageObject.messageText);
        $messageList.append($('<li>').append(spanMessageWriter).append(spanMessageText));
    });

    socket.on('join', function (msg) {
        var messageObject = JSON.parse(msg);
        var spanMessageWriter = $('<span>').addClass('join-author').text(messageObject.name);
        var spanMessageText = $('<span>').addClass('join-text').text(messageObject.messageText);
        $messageList.append($('<li>').addClass('join').addClass(messageObject.isFemale ? 'girl' : 'guy').append(spanMessageWriter).append(spanMessageText));
    });

    socket.on('leave', function (msg) {
        var messageObject = JSON.parse(msg);
        var spanMessageWriter = $('<span>').addClass('join-author').text(messageObject.name);
        var spanMessageText = $('<span>').addClass('join-text').text(messageObject.messageText);
        $messageList.append($('<li>').addClass('leave').addClass(messageObject.isFemale ? 'girl' : 'guy').append(spanMessageWriter).append(spanMessageText));
    });
});

