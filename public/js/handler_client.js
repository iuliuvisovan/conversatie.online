var socket = io();

var randomNames = ["Strut Modest",
    "Supplexa Onac Memoranda",
    "Intuneric Steluta Luminita",
    "Rămurica Pastrama",
    "Sfecla Geniloni",
    "Gigel Potrivitu",
    "Rudolf Pufulete",
    "Branza William",
    "Andaluzia Posirca",
    "Lacrima Renato",
    "Dicusara Tuduce Dorule",
    "Trita Fanita",
    "Raiu Viorica Speranta",
    "Artaxerxe Bubulac",
    "Exacustodian Pausescu",
    "Amorel Vatamanescu",
    "Marcelon Bunica",
    "Fridolin Boacsa",
    "Momcilo Luburici",
    "Georgian Elvis Gagiu",
    "Tolea Ciumac",
    "Salomeea Guinea",
    "Dumbrava Codrut",
    "Hopulele Mariana",
    "Maer Enola Fotini Analena",
    "Eugen Catalin Prefacutu Timpau",
    "Joaca-Bine Mirel",
    "Sava Superman",
    "Bred Pit",
    "Voda Bogdan",
    "Gheorghe Bettjinio Diamant",
    "Adonis Bunghis",
    "Aristotel Argentina",
    "Daniel Mai-Mihai",
    "Duru Marin Cervantes",
    "Venera Balta",
    "Leopoldina Balanuta",
    "Vasile San Siro Ciocoi",
    "Bizdoaca Nicu"
];
var $messageBox = $('#inputMessage');
var $messageList = $('#messages');
var newMessages = 0;
var isWindowFocused = true;
var lastMessageSenderId = '';

window.onbeforeunload = function () {
    return "I am a message";
};

$(document).ready(() => {
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
    $messageBox.focus();
    do {
        var person = prompt("Cum te cheamă? (Cancel sau Esc pentru alt nume șmecher)", randomNames[new Date().getTime() % 38]);
    } while (!person);
    // var person = 'Anuță';
    $("#inputMessage").attr('placeholder', 'Ce le scriem țăranilor ăstora, ' + person + '?');
    socket.emit('check-in', person);

    socket.on('join', msg => {
        var messageObject = JSON.parse(msg);
        var spanMessageWriter = $('<span>').addClass('join-author').text(messageObject.name);
        var spanMessageText = $('<span>').addClass('join-text').text(messageObject.messageText);
        $messageList.append($('<li>').addClass('join').addClass(messageObject.isFemale ? 'girl' : 'guy').append(spanMessageWriter).append(spanMessageText));
        $messageList.scrollTop($messageList[0].scrollHeight);
    });

    socket.on('chat message', msg => {
        var messageObject = JSON.parse(msg);
        var spanMessageAuthor = $('<span>')
            .addClass('message-author')
            .text(messageObject.socketId == socket.id ?
                'Tu (' + messageObject.name + ')' :
                messageObject.name);
        var spanMessageText = $('<span>')
                            .addClass('message-text')
                            .html(replaceWithEmojis(messageObject.messageText));

        var li = $('<li>');
        var currentDate = new Date();
        var currentDateString = `${currentDate.getHours().toString().padStart(2, '0')}:${currentDate.getMinutes().toString().padStart(2, '0')}:${currentDate.getSeconds().toString().padStart(2, '0')}`;
        if (messageObject.socketId == lastMessageSenderId) {
            $('.message-time').last().text(currentDateString);
            li.addClass('same-sender');
        } else {
            li.append($('<span>')
                .addClass('message-time')
                .text(currentDateString));
        }

        if (messageObject.socketId == socket.id) {
            li.addClass('mine');
        } else {
            li.append($('<span>')
                .addClass('message-time-individual')
                .text(currentDateString));
            let first = new Audio('/sounds/chatMessage.mp3');
            first.loop = false;
            first.play();
        }
        li.append(spanMessageAuthor)
        li.append(spanMessageText);
        if (messageObject.socketId == socket.id) {
            li.append($('<span>')
                .addClass('message-time-individual')
                .text(currentDateString));
        }

        $messageList.append(li);
        $messageList.scrollTop($messageList[0].scrollHeight);
        lastMessageSenderId = messageObject.socketId;
        if (!isWindowFocused) {
            newMessages++;
            $('title').html('(' + newMessages + ') d3i');
            var imageNumber = (newMessages >= 8 ? 7 : newMessages);
            $('#favicon').attr('href', 'img/favicon_' + (imageNumber + 1) + '.png');
        }
    });

    socket.on('leave', msg => {
        var messageObject = JSON.parse(msg);
        var spanMessageWriter = $('<span>').addClass('join-author').text(messageObject.name);
        var spanMessageText = $('<span>').addClass('join-text').text(messageObject.messageText);
        $messageList.append($('<li>').addClass('leave').addClass(messageObject.isFemale ? 'girl' : 'guy').append(spanMessageWriter).append(spanMessageText));
        $messageList.scrollTop($messageList[0].scrollHeight);
    });
});