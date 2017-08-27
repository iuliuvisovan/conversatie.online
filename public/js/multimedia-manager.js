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

        return `<a target='_blank' href='${input}'>${input}</a>`;
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
    return input;
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
            height: '180',
            width: '320',
            videoId: videoId,
            events: {
                'onStateChange': event => {
                    if (event.data == YT.PlayerState.PLAYING) {
                        socket.emit('start-media', messageId);
                    }
                }
            }
        });
    }, 0);
}

function playYoutubePlayerById(messageId) {
    youtubePlayers[messageId].playVideo();
}

function loadIframeApi() {
    // 2. This code loads the IFrame Player API code asynchronously.
    var tag = document.createElement('script');

    tag.src = "https://www.youtube.com/iframe_api";
    var firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
}