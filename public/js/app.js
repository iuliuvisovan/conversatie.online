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
var userId = '';

//Username
var userName = '';

//Color of the user
var userColor = '';

//The user's last sent message, so he can access it using the up arrow
var lastSentMessage = '';

//Timestamp of the last 'write' event from current user, so dispatch frequency can be tracked & throttle
var lastWriteEventDispatchTimestamp = new Date();

//Set it to 5 seconds ago by default, so can be dispatched on first key press
lastWriteEventDispatchTimestamp.setSeconds(new Date().getSeconds() - 5);

//Reference to the setTimeout that removed the 'writing' indicator
var removeWritingTimeout;

//Message played when sending a chat message
var chatMessageSound = new Audio('/sounds/chatMessage.mp3');
chatMessageSound.loop = false;

//Public key of app, to be used for by PWA subscription requests
var applicationServerPublicKey = "BMEi_ez0hgDxewidO83qBFenXDfkie8kQmfPnj1AJBsZ9EqgywI5Oo3yK5i6Xp0DMYlHNCEBvF0ayUk2f1PUsD0";

//Reference to the last video that played
var lastPlayingPlayer;

function updatePlaybar() {
    var player = getPlayingVideo();
    if (!player)
        player = lastPlayingPlayer;
    if (!lastPlayingPlayer)
        return;
    $("#currentVideoName").text(player.getVideoData().title);
    $(".controls").removeClass('playing');
    if (player.getPlayerState() == YT.PlayerState.PLAYING)
        $(".controls").addClass('playing');
    $(".mute-button").removeClass('muted');
    if (player.isMuted())
        $(".mute-button").addClass('muted');
    $("#playBar").removeClass('no-video');
}

//Everything happens after YT player is loaded
loadIframeApi();

function onYouTubeIframeAPIReady() {
    // managePwa();
    handleUserId();
    handleBeforeUnload();
    handleWindowFocus();
    getUserName();

    ga('set', 'userId', userId);
    $inputMessage.focus();
    socket.emit('check in', JSON.stringify({
        userId,
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
    handleImagePaste();
    fixKeyboardOpen();
    handleAccessLastMessage();
    fixUserListHover();
    setupShareMethod();
}


//Event handlers
{
    function handleOnlineUsersUpdateEvent() {
        socket.on('online users update', msg => {
            var onlineUsers = JSON.parse(msg);

            var $onlineUserList = $(".online-users-list");
            $(".online-user").remove();

            $("#aloneBar")[onlineUsers.length < 2 ? 'removeClass' : 'addClass']('no-video');

            onlineUsers
                .sort((a, b) => a.lastMessageSecondsAgo > b.lastMessageSecondsAgo ? 1 : -1)
                .forEach(onlineUser => {
                    var isMe = onlineUser.socketId.split('#')[1] == socket.id;

                    $onlineUserList.prepend(
                        $("<span>")
                        .addClass('online-user')
                        .css('border', '1px solid ' + onlineUser.color)
                        .css('order', isMe ? '-1' : '')
                        .css('text-decoration', isMe ? 'underline' : '')
                        .css('background', onlineUser.color)
                        .attr('title', isMe ? 'Tu' : onlineUser.name)
                        .text(onlineUser.name)
                    );
                });

            setTimeout(() => {
                $(".online-users-list").removeClass('is-overflowing');
                setTimeout(() => {
                    if (($(".online-users-list")[0].scrollWidth - 20) > $(".online-users-list")[0].clientWidth

                        ||
                        ($(".online-users-list")[0].scrollHeight - 20) > $(".online-users-list")[0].clientHeight) {
                        $(".online-users-list").addClass('is-overflowing');
                    } else {
                        $(".online-users-list").removeClass('is-overflowing');
                    }
                }, 0);
            }, 500);
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


                userColor = messageObject.color;
                $('#options, .share-button').css('color', userColor);
                $('#inputSend').css('border-color', userColor);
                $('#playBar, #aloneBar, .progress, .circle, .bar').css('background', userColor);
                $('#buttonRequestFullScreen').css('color', userColor).css('border-color', userColor);
                $("meta[name='theme-color']").attr('content', userColor);
                $('#favicon').attr('href', 'img/logo_' + userColor.slice(1) + '.png?v=' + +new Date());
                $('.watermark').attr('src', 'img/logo_' + userColor.slice(1) + '.png?v=' + +new Date());
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
        socket.on('i am active', (msg) => {
            msg = JSON.parse(msg);

            //Don't treat me as a person who saw the message
            if (msg.socketId == socket.id)
                return;

            //Only track seen for my messages
            if (socket.id != lastMessageSenderId)
                return;

            //Only add as user who saw if not already in the list
            if (!$(".user-who-saw[data-color='" + msg.color + "'] ").length)
                $(".users-who-saw").append(
                    $("<div>")
                    .addClass('user-who-saw')
                    .css('background', msg.color)
                    .attr('data-color', msg.color));
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
            var shouldAutoPlay = !!messageObject.shouldAutoPlay;
            var autoPlayStartSeconds = messageObject.autoPlayStartSeconds;
            if (youtubeVideoId) {
                createYoutubeVideo($(messageContent).attr('id'), youtubeVideoId, shouldAutoPlay, autoPlayStartSeconds);
                ga('send', 'event', 'Message', 'sendVideo', youtubeVideoId);
            }


            var $spanMessageText = $('<span>')
                .addClass('message-text')
                .addClass(youtubeVideoId ? 'youtube-video' : '')
                .attr('title', youtubeVideoId ? 'Vezi mai mare' : '')
                .attr('onclick', 'setAsLargeVideo(this)')
                .css('background', messageObject.color)
                .css('color', messageObject.color)
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
                socket.emit('i am active');
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
        socket.on('sync media', message => {
            message = JSON.parse(message);
            var messageId = message.messageId;
            var currentTime = message.currentTime;
            var playerState = message.playerState;
            if (message.socketId == socket.id) {
                if (playerState == YT.PlayerState.PLAYING)
                    Object.keys(youtubePlayers).forEach(x => {
                        if (x != messageId)
                            youtubePlayers[x].pauseVideo();
                    });
            }

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

            //Remove any leftover 'writing' thingy
            $(".writing[data-sender-socketid='" + messageObject.socketId + "']").remove();
            fixScroll();
            ga('send', 'event', 'Application', 'leave', messageObject.name);
        });
    }
}


//User actions
{

    function changeUserName() {
        getUserName(true);
        socket.emit('check in', JSON.stringify({
            userName,
            userTopic
        }));
        $('#inputMessage').focus();
        $(".users-who-saw").children().remove();
    }

    function changeUserTopic() {
        userTopic = '';
        getUserTopic();
        if (!userName)
            userName = localStorage.userName;
        socket.emit('check in', JSON.stringify({
            userName,
            userTopic
        }));
        ga('send', 'event', 'Application', 'joinTopic', userTopic);
        $('#inputMessage').focus();
        $(".users-who-saw").children().remove();
    }

    function getUserName(isNameChange) {
        userName = localStorage.userName;
        if (isNameChange)
            userName = prompt("Cum te cheamă? (Cancel sau Esc pentru alt nume șmecher)", userName).substr(0, 20);
        else if (!userName) {
            userName = prompt("Cum te cheamă?", randomNames[new Date().getTime() % 38]).substr(0, 20);
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

    function sendMessage(message) {
        if (!message)
            var message = $('<div/>').html($inputMessage.val()).text().trim();
        if (message) {
            if (message.length > 500 && !message.includes('image/'))
                return;
            if (message.toLowerCase().includes('play ')) {
                $(".progress").css('background-color', '#cc0404');
                $(".progress").css('opacity', '1');
                $(".progress").addClass('progressing');
            }
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

    function setAsLargeVideo(element) {
        var iAmExpanded;

        //If clicked on the minimize/maximize button
        if ($(element).hasClass('expanded'))
            iAmExpanded = true;

        $('.with-preview').removeClass('with-preview');
        $('.expanded').removeClass('expanded').attr('title', 'Mai mare');
        $('.previewed').removeClass('previewed');
        $('iframe')
            .attr('width', 320)
            .attr('height', 180);

        //Definitely clicked on maximize button
        if (!iAmExpanded) {
            var iframeWidth = (window.innerWidth > 675 ? 675 : window.innerWidth);
            var iframeHeight = iframeWidth / 1.77;

            $(".status-bar")
                .addClass('with-preview');

            $(element).addClass('expanded').attr('title', 'Mai mic');
            $(element)
                .find('iframe')
                .attr('width', iframeWidth)
                .attr('height', iframeHeight);
            $(element).parent('li').addClass('previewed');
        }
    }
}

//UI & behavior
{
    function handleUserId() {
        var userId = localStorage.userId;
        if (!userId) {
            localStorage.userId = +new Date();
        }
    }

    function toggleFullScreen() {
        console.log('toggling fullscreen');
        var doc = window.document;
        var docEl = doc.documentElement;

        var requestFullScreen = docEl.requestFullscreen || docEl.mozRequestFullScreen || docEl.webkitRequestFullScreen || docEl.msRequestFullscreen;
        var cancelFullScreen = doc.exitFullscreen || doc.mozCancelFullScreen || doc.webkitExitFullscreen || doc.msExitFullscreen;

        if (!doc.fullscreenElement && !doc.mozFullScreenElement && !doc.webkitFullscreenElement && !doc.msFullscreenElement) {
            requestFullScreen.call(docEl);
        } else {
            cancelFullScreen.call(doc);
        }
    }

    function getPlayingVideo() {
        return youtubePlayers[Object.keys(youtubePlayers).find(x =>
            youtubePlayers[x].getPlayerState() == YT.PlayerState.PLAYING)];
    }

    function toggleCurrentVideo() {
        var player = getPlayingVideo();
        if (!player)
            player = lastPlayingPlayer;
        if (player.getPlayerState() == YT.PlayerState.PLAYING)
            player.pauseVideo();
        else {
            player.playVideo();
        }
        updatePlaybar();
    }

    function toggleMuteCurrentVideo() {
        var player = getPlayingVideo();
        if (!player)
            player = lastPlayingPlayer;
        if (player.isMuted())
            player.unMute();
        else {
            player.mute();
        }
        setTimeout(updatePlaybar, 300);
    }

    function handleWindowFocus() {
        $(window).focus(() => {
            if (unseenMessageCount) {
                $("li:not(.not-seen)").addClass('seen-on-focus');
                $(".not-seen").removeClass('not-seen');
                setTimeout(() => {
                    $("li:not(.not-seen)").removeClass('seen-on-focus');
                }, 7000);
                socket.emit('i am active');
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
        $("#inputMessage").keydown(e => {
            var message = $("#inputMessage").val();
            if ($("#inputMessage").val().trim().length)
                $('#inputSend').removeClass('opaque');
            else
                $('#inputSend').addClass('opaque');

            if (e.keyCode == 13 && !e.shiftKey) {
                sendMessage(message);
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

    function handleBeforeUnload() {
        window.onbeforeunload = function () {
            return "I am a message";
        };
    }


    function fileToBase64(myFile) {
        return new Promise((resolve, reject) => {
            var coolFile = {};

            function readerOnload(e) {
                var base64 = btoa(e.target.result);
                coolFile.base64 = base64;
                resolve(coolFile);
            };

            var reader = new FileReader();
            reader.onload = readerOnload;

            var file = myFile[0].files[0];
            coolFile.filetype = file.type;
            coolFile.size = file.size;
            coolFile.filename = file.name;
            reader.readAsBinaryString(file);
        });
    }

    function handleImagePaste() {
        $(".progress").on('animationend webkitanimationend', () => {
            $(".progress").removeClass('progressing');
            $(".progress").css('opacity', '0');
        });

        document.onpaste = function (event) {
            var items = (event.clipboardData || event.originalEvent.clipboardData).items;
            for (index in items) {
                var item = items[index];
                if (item.kind === 'file') {
                    $(".progress").css('background-color', userColor);
                    $(".progress").css('opacity', '1');
                    $(".progress").addClass('progressing');

                    var blob = item.getAsFile();
                    var reader = new FileReader();
                    socket.emit('i am writing');
                    reader.onload = (event) => {
                        var imageDataUrl = event.target.result;
                        sendMessage(imageDataUrl);
                    };
                    reader.readAsDataURL(blob);
                }
            }
        }
    }

    function copyLink() {
        let α = document.createRange(),
            ρ = window.getSelection();
        α.selectNodeContents($(`#pageLink`)[0]);
        ρ.removeAllRanges();
        ρ.addRange(α);
        document.execCommand('copy') && $(`#C span`).addClass('shown');
    }

    function fixUserListHover() {
        $(".online-users-list.is-overflowing").hover(function () {
            console.log('dsds');
            $(this).addClass('hovered');
        }, function () {
            setTimeout(function () {
                $(this).removeClass('hovered');
            }, 100);
        });
    }

    function setupShareMethod() {
        if (navigator.share) {
            $(".share-enabled").show();
        } else {
            $(".share-disabled").show();
        }
    }

    function isMobileDevice() {
        if (/Mobi/.test(navigator.userAgent)) {
            return true;
        }
    }
}

//Progressive web app management
{
    function share() {
        navigator.share({
                title: 'Conversează. Online!',
                text: 'Nu sta deoparte. Hai și tu în conversație!',
                url: 'https://www.conversatie.online',
            })
            .then(() => console.log('Successful share'))
            .catch((error) => console.log('Error sharing', error));
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

                socket.emit('subscribe', JSON.stringify({
                    pushMessageSubscription: subscription,
                    userId: userId
                }));

                isSubscribed = true;
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