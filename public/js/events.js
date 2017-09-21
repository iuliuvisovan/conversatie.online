//Socket.io event handlers

//Call every method in this file
function handleSocketEvents() {
    handleJoinEvent();
    handleOnlineUsersUpdateEvent();
    handleRoomHistoryEvent();
    handleActiveEvent();
    handleWriteEvent();
    handleChatMessageEvent();
    handleSyncMediaEvent();
    handleLeaveEvent();
}

var shouldPlaySounds = true;

function handleRoomHistoryEvent() {
    socket.on('room history', msg => {
        var messages = JSON.parse(msg);
        shouldPlaySounds = false;
        messages.forEach(x => onChatMessage(x));
        setTimeout(function () {
            shouldPlaySounds = true;
        }, 2000);
    });
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
                var isMe = onlineUser.userId == userId;

                $onlineUserList.prepend(
                    $("<span>")
                    .addClass('online-user')
                    .addClass(onlineUser.isInActive ? 'inactive' : '')
                    .css('border', '1px solid ' + onlineUser.color)
                    .css('order', isMe ? '-1' : '')
                    .css('text-decoration', isMe ? 'underline' : '')
                    .css('background', onlineUser.color)
                    .attr('title', isMe ?
                        'Tu' :
                        onlineUser.isInActive ?
                            onlineUser.name + " (Inactiv - va primi notificări)" :
                            onlineUser.name)
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
            if (messageObject.userId == userId && userRoom != 'start')
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

        if (messageObject.userId == userId) {
            //Revert the layout if any video was maximized
            unsetAsLargeVideo();

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
            .addClass(messageObject.userId == userId ? 'me' : '')
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
        chatJoinSound.play();
        fixScroll(true);
    });
}

function handleActiveEvent() {
    socket.on('i am active', (msg) => {
        msg = JSON.parse(msg);

        //Don't treat me as a person who saw the message
        if (msg.userId == userId)
            return;

        //Only track seen for my messages
        if (userId != lastMessageUserId)
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
        var isMine = (messageObject.userId == userId);

        if (!isMine) {
            var spanMessageAuthor = $('<span>')
                .addClass('message-author')
                .text(messageObject.name);
        }

        var $writingLi = $('<li>')
            .attr('data-sender-userId', messageObject.userId)
            .addClass('writing');
        var spanMessageText = $('<span>')
            .addClass('message-text')
            .css('color', messageObject.color)
            .text('...');

        $writingLi.css('border-color', messageObject.color)
        var currentDate = new Date();
        var currentDateString = `${currentDate.getHours().toString().padStart(2, '0')}:${currentDate.getMinutes().toString().padStart(2, '0')}:${currentDate.getSeconds().toString().padStart(2, '0')}`;
        if (messageObject.userId == lastMessageUserId) {
            $writingLi.addClass('same-sender');
        }

        if (isMine) {
            $writingLi.addClass('mine');
        }
        $writingLi.append(spanMessageAuthor)
        $writingLi.append(spanMessageText);
        if (isMine) {
            $writingLi.append($('<span>')
                .addClass('message-time-individual')
                .text(currentDateString));
        }

        if (!isMine && !$(".writing[data-sender-userId='" + messageObject.userId + "']").length) {
            $writingLi.addClass('just-sent');
            $('#messages').append($writingLi);
            setTimeout(() => {
                $writingLi.removeClass('just-sent');
            }, 0);
        }

        clearInterval(intervalRemoveWriting);
        intervalRemoveWriting = setTimeout(() => {
            $(".writing[data-sender-userId='" + messageObject.userId + "']").remove();
        }, 3000);

        fixScroll();
    });
}

function onChatMessage(message) {
    if (message.messageText.includes(`{"isCorrective"`)) {
        var correctionInfo = JSON.parse(message.messageText);
        var $targetMessage = $(`li[id="${correctionInfo.targetMessageId}"`);
        $targetMessage.find('.message-text span').html(correctionInfo.targetMessageReplacement);
        return;
    }

    var isMine = (message.userId == userId);

    if (!isMine) {
        var spanMessageAuthor = $('<span>')
            .addClass('message-author')
            .text(message.name);
    }

    var messageContent = replaceWithMultiMedia(
        message.messageText,
        message.messageUnixTime);
    var youtubeVideoId = $(messageContent).attr('data-youtube-url');
    var shouldAutoPlay = !!message.shouldAutoPlay;
    var autoPlayStartSeconds = message.autoPlayStartSeconds;
    if (youtubeVideoId) {
        createYoutubeVideo($(messageContent).attr('id'), youtubeVideoId, shouldAutoPlay, autoPlayStartSeconds);
        ga('send', 'event', 'Message', 'sendVideo', youtubeVideoId);
    }


    var $spanMessageText = $('<span>')
        .addClass('message-text')
        .addClass(youtubeVideoId ? 'youtube-video' : '')
        .attr('title', youtubeVideoId ? 'Vezi mai mare' : '')
        .attr('onclick', youtubeVideoId ? 'toggleAsLargeVideo(this)' : '')
        .css('background', message.color)
        .css('color', message.color)
        .html(messageContent);

    var $messageLi = $('<li>');
    $messageLi
        .css('border-color', message.color)
        .attr('id', message.messageId);
    if (!isWindowFocused)
        $messageLi.addClass('not-seen');
    var currentDate = new Date();
    var currentDateString = `${currentDate.getHours().toString().padStart(2, '0')}:${currentDate.getMinutes().toString().padStart(2, '0')}:${currentDate.getSeconds().toString().padStart(2, '0')}`;
    if (message.userId == lastMessageUserId) {
        $messageLi.addClass('same-sender');
    }

    $(".users-who-saw").children().remove();

    if (isMine) {
        $messageLi.addClass('mine');
    } else {
        if (shouldPlaySounds) {
            if (youtubeVideoId)
                setTimeout(() => {
                    youtubeVideoSound.play();
                }, 500);
            chatMessageSound.play();
        }
        $messageLi.append($('<span>')
            .addClass('message-time-individual')
            .text(currentDateString));
    }
    $messageLi.append(spanMessageAuthor)
    $messageLi.append($spanMessageText);
    if (isMine) {
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
    lastMessageUserId = message.userId;

    if (!isWindowFocused) {
        unseenMessageCount++;
        if (userRoom.toLowerCase().trim() != 'start')
            $('title').text('(' + unseenMessageCount + ') #' + userRoom + '- Conversează. Online!');
        else
            $('title').text('(' + unseenMessageCount + ') Conversează. Online! - www.conversatie.online');
        $('#favicon').attr('href', 'img/logo_' + message.color.slice(1) + '.png');
    } else {
        socket.emit('i am active');
    }

    if ($(".writing[data-sender-userId='" + message.userId + "']").length) {
        clearInterval(intervalRemoveWriting);
        $(".writing[data-sender-userId='" + message.userId + "']").remove();
        lastWriteEventDate.setSeconds(new Date().getSeconds() - 5);
        return;
    }
}

function handleChatMessageEvent() {
    chatMessageSound.loop = false;
    youtubeVideoSound.loop = false;
    chatLeaveSound.loop = false;
    socket.on('chat message', msg => {
        onChatMessage(JSON.parse(msg));
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

        if (message.userId == userId) {
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
        chatLeaveSound.play();

        //Remove any leftover 'writing' thingy
        $(".writing[data-sender-userId='" + messageObject.userId + "']").remove();
        fixScroll();
        ga('send', 'event', 'Application', 'leave', messageObject.name);
    });
}