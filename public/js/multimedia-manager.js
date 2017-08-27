var youtubePlayers = {};

function replaceWithMultiMedia(input, messageId) {
    if (isValidURL(input)) {
        input = input.slice(0, 1).toLowerCase() + input.slice(1, input.length - 1);
        if (!input.toLowerCase().includes('http'))
            input = 'http://' + input;
        //Check for images
        if (input.match(/.(jpg|jpeg|png|gif)$/i))
            return `<a target='_blank' href='${input}'>
                        <img src="${input}" style="max-width: 250px; max-height: 250px;" />
                        <div style="max-width: 250px">${input}</div>
                    </a>`;
        if (input.match(/youtube.com/i)) {
            var embedYoutubeUrl = getYoutubeVideoId(input);
            return `<div data-youtube-url='${embedYoutubeUrl}' id='${'msg' + messageId}'></div>`;
        }

        return `<a target='_blank' style="word-break: break-all;" href='${input}'>${input}</a>`;
    }

    emojiMatchPairs.forEach(matchPair => {
        input = input.replace(new RegExp(escapeRegExp(matchPair.emojiChars) + '(\\.)?', 'gi'),
            `<span 
                class="emoji" 
                title="${matchPair.emojiTitle}"
                style="font-size: ${22 + matchPair.sizeIncrease}px"
                >${matchPair.emoji}</span>
            `
        );
    })
    return `<span>${input}</span>`;
}

function escapeRegExp(text) {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
}

function isValidURL(str) {
    return str.match(/^((https?:\/\/)?[\w-]+(\.[\w-]+)+\.?(:\d+)?(\/\S*)?)/igm);
}

function getYoutubeVideoId(url) {
    var regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#\&\?]*).*/;
    var match = url.match(regExp);
    return (match && match[7].length == 11) ? match[7] : false;
}

var youtubePlayers = {};

function createYoutubeVideo(messageId, videoId) {
    // 3. This function creates an <iframe> (and YouTube player)
    //    after the API code downloads.

    setTimeout(() => {
        youtubePlayers[messageId] = new YT.Player(messageId, {
            playerVars: {
                modestbranding: true,
            },
            height: '180',
            width: '320',
            videoId: videoId,
            startSeconds: 0,
            modestbranding: 1,
            events: {
                'onStateChange': event => {
                    var player = youtubePlayers[messageId];
                    var currentTime = player.getCurrentTime();

                    socket.emit('sync-media', JSON.stringify({
                        messageId,
                        currentTime,
                        playerState: event.data
                    }));
                }
            }
        });
    }, 0);
}

function syncYoutubePlayerById(messageId, startTime, playerState) {
    var player = youtubePlayers[messageId];
    if (playerState == YT.PlayerState.PAUSED) {
        if (player.getPlayerState() != YT.PlayerState.PAUSED) {
            player.pauseVideo();
            player.seekTo(startTime + 1); //Network delay & load :s
        }
    }

    if (playerState == YT.PlayerState.PLAYING) {
        if (player.getPlayerState() != YT.PlayerState.PLAYING) {
            player.seekTo(startTime + 1); //Network delay & load :s
            player.playVideo();
        }
    }
}

function loadIframeApi() {
    // 2. This code loads the IFrame Player API code asynchronously.
    var tag = document.createElement('script');

    tag.src = "https://www.youtube.com/iframe_api";
    var firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
}