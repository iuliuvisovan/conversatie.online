function replaceWithEmojis(input) {
    if(isValidURL(input)) {
        input = input.slice(0, input.length - 1);
        return `<a target='_blank' href='${input.toLowerCase()}'>${input.toLowerCase()}</a>`;
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
    var a  = $('<a>')[0];
    a.href = str;
    return (a.host && a.host != window.location.host);
 }