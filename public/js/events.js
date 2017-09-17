//Socket.io event handlers

//Call every method in this file
function handleSocketEvents() {
    handleJoinEvent();
    handleOnlineUsersUpdateEvent();
    handleActiveEvent();
    handleWriteEvent();
    handleChatMessageEvent();
    handleSyncMediaEvent();
    handleLeaveEvent();
}

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

        //First trigger that socket is connected
        if (!isAppInitiated)
            initApp();

        var messageObject = JSON.parse(msg);

        if (!messageObject.oldName) {
            var messageText = messageObject.messageText;
            if (messageObject.socketId == socket.id && userRoom != 'start')
                messageText = `#${userRoom} - ` + messageText;
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
            //Revert the layout if any video was maximized
            unsetAsLargeVideo();

            if (!spanMessageAuthorOld)
                $('#messages').children().remove();
            $('#messages')
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
        $('#messages').append($joinLi);
        setTimeout(() => {
            $joinLi.removeClass('just-sent');
        }, 0);
        fixScroll(true);
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
    lastWriteEventDate.setSeconds(new Date().getSeconds() - 5); //Initialized at 5 seconds ago, so event can be instantly dispatched when app is running

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
            $('#messages').append($writingLi);
            setTimeout(() => {
                $writingLi.removeClass('just-sent');
            }, 0);
        }

        clearInterval(intervalRemoveWriting);
        intervalRemoveWriting = setTimeout(() => {
            $(".writing[data-sender-socketid='" + messageObject.socketId + "']").remove();
        }, 3000);

        fixScroll();
    });
}

function handleChatMessageEvent() {
    chatMessageSound.loop = false,

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
                .attr('onclick', youtubeVideoId ? 'toggleAsLargeVideo(this)' : '')
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
            $('#messages').append($messageLi);
            setTimeout(() => {
                $messageLi.removeClass('just-sent');
            }, 0);

            fixScroll(true);
            lastMessageSenderId = messageObject.socketId;

            if (!isWindowFocused) {
                unseenMessageCount++;
                if (userRoom.toLowerCase().trim() != 'start')
                    $('title').text('(' + unseenMessageCount + ') #' + userRoom + '- Conversează. Online!');
                else
                    $('title').text('(' + unseenMessageCount + ') Conversează. Online! - www.conversatie.online');
                $('#favicon').attr('href', 'img/logo_' + messageObject.color.slice(1) + '.png');
            } else {
                socket.emit('i am active');
            }

            if ($(".writing[data-sender-socketid='" + messageObject.socketId + "']").length) {
                clearInterval(intervalRemoveWriting);
                $(".writing[data-sender-socketid='" + messageObject.socketId + "']").remove();
                lastWriteEventDate.setSeconds(new Date().getSeconds() - 5);
                return;
            }
        });
}


var lastVideoInteractionUpdate = new Date();
lastVideoInteractionUpdate.setSeconds(new Date().getSeconds() - 5);

function handleSyncMediaEvent() {
    socket.on('sync media', message => {
        //Don't handle more frequently than once every 200ms
        if ((new Date() - lastVideoInteractionUpdate) / 1000 < 0.2) {
            return;
        }

        message = JSON.parse(message);
        var messageId = message.messageId;
        var currentTime = message.currentTime;
        var playerState = message.playerState;

        if ($('.expanded').length && playerState == YT.PlayerState.PLAYING && !$(`.expanded iframe[id='${messageId}']`).length)
            toggleAsLargeVideo($(`iframe[id='${messageId}']`).parent());
        $("#lastVideoInteraction").css('background', message.color).attr('title', 'Ultima data schimbat de ' + message.name);;
        lastVideoInteractionUpdate = new Date();

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

        $('#messages').append($leaveLi);
        setTimeout(() => {
            $leaveLi.removeClass('just-sent');
        }, 0);

        //Remove any leftover 'writing' thingy
        $(".writing[data-sender-socketid='" + messageObject.socketId + "']").remove();
        fixScroll();
        ga('send', 'event', 'Application', 'leave', messageObject.name);
    });
}