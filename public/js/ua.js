//User action
function changeUserName() {
    getUserName(true);
    socket.emit('change name', userName);
    $('#inputMessage').focus();
    $(".users-who-saw").children().remove();
}

function changeUserRoom() {
    userRoom = '';
    getUserRoom();
    ga('send', 'event', 'Application', 'joinRoom', userRoom);
    window.onbeforeunload = $.noop;
    localStorage.room = userRoom;
    if (userRoom == "start")
        window.location.href = window.location.origin;
    else
        window.location.hash = userRoom;
}

function getUserName(isNameChange) {
    userName = localStorage.userName;
    if (isNameChange)
        userName = prompt("Cum te cheamă? (Cancel sau Esc pentru alt nume șmecher)", userName).substr(0, 20);
    else if (!userName) {
        userName = prompt("Cum te cheamă?").substr(0, 20);
    }
    if (userName)
        localStorage.userName = userName;
    else
        userName = localStorage.userName;
}

function getUserRoom() {
    var promptText = "Despre ce vrei sa vorbesti? (Lasă gol pentru a reveni la pagina de start.)";
    userRoom = prompt(promptText, userRoom);

    if (!userRoom)
        userRoom = 'start';
    else
        userRoom = userRoom.toLowerCase().trim().replace(/[^\w]/g, '');
    updateUserRoom();
}

function updateUserRoom() {
    if (userRoom.trim() != 'start') {
        window.location.hash = userRoom;
        $('#roomName').text('#' + userRoom);
        $('title').html('#' + userRoom + ' - Conversează. Online!');
    } else {
        $('#roomName').text('');
        $('title').html('Conversează. Online!');
    }
    localStorage.room = userRoom;
}

function handleAccessLastMessage() {
    $("#inputMessage").keyup(e => {
        if (e.keyCode == 38) {
            $("#inputMessage").val(lastSentMessage);
        }
        if (e.keyCode == 40) {
            $("#inputMessage").val('');
        }
    });
}

function iAmWriting() {
    if (Math.abs(new Date().getSeconds() - lastWriteEventDate.getSeconds()) > 1) {
        socket.emit('i am writing');
        lastWriteEventDate = new Date();
    }
}

function sendMessage(message) {
    if (!message)
        var message = $('<div/>').html($("#inputMessage").val()).text().trim();
    if (message) {
        if (message.length > 800 && !message.includes('image/'))
            return;
        if (message.toLowerCase().trim().startsWith('play ')) {
            $(".progress").css('background-color', '#cc0404');
            $(".progress").css('opacity', '1');
            $(".progress").addClass('progressing');
        }
        $("#inputMessage").val('');
        socket.emit('chat message', message);
        lastSentMessage = message;
        ga('send', 'event', 'Message', 'send', message);
    }
    $("#inputMessage").focus();
    $('#inputSend').addClass('opaque');
}

function handleOptions() {
    $("#options").change(function () {
        switch (this.value) {
            case 'change-name':
                changeUserName();
                break;
            case 'change-topic':
                changeUserRoom();
                break;
        }
        $("#options").val(0);
    });
}

function setAsLargeVideo(element) {
    var iframeWidth = (window.innerWidth > 675 ? 675 : window.innerWidth);
    var iframeHeight = iframeWidth / 1.77;

    $(".status-bar")
        .addClass('with-preview');

    $(element).addClass('expanded').attr('title', 'Mai mic');
    $('.enlarge-video').addClass('expanded').attr('title', 'Mai mic');

    $(element)
        .find('iframe')
        .attr('width', iframeWidth)
        .attr('height', iframeHeight);
    $(element).parent('li').addClass('previewed');
}

function unsetAsLargeVideo(element) {
    $('.with-preview').removeClass('with-preview');
    $('.expanded').removeClass('expanded').attr('title', 'Mai mare');
    $('.previewed').removeClass('previewed');
    $('iframe')
        .attr('width', 320)
        .attr('height', 180);
}


function toggleAsLargeVideo(element) {
    if (!element) {
        var playBarVideo = getPlayingVideo() || lastPlayingPlayer;
        var videoId = Object.keys(youtubePlayers).find(x => youtubePlayers[x] == playBarVideo);
        element = $(`iframe[id='${videoId}']`).parent();
    }

    var iAmExpanded;

    //If clicked on the minimize/maximize button
    if ($(element).hasClass('expanded'))
        iAmExpanded = true;

    unsetAsLargeVideo(element);

    if (!iAmExpanded)
        setAsLargeVideo(element);
}