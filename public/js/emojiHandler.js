var emojiMatchPairs = [
    ...Array.from(new Array(9)).map((x, i) => {
        return {
            emojiChars: ':))' + ')'.repeat(i),
            emoji: '😂',
            sizeIncrease: i * 5,
            emojiTitle: 'râs cu lacrimi'
        }
    }).reverse(),
    ...Array.from(new Array(9)).map((x, i) => {
        return {
            emojiChars: '=))' + ')'.repeat(i),
            emoji: '🤣',
            sizeIncrease: i * 5,
            emojiTitle: 'râs pe jos cu lacrimi'
        }
    }).reverse(),
    ...Array.from(new Array(9)).map((x, i) => {
        return {
            emojiChars: ':D' + 'D'.repeat(i),
            emoji: '😁',
            sizeIncrease: i * 5,
            emojiTitle: 'zâmbet cu dinți'
        }
    }).reverse(),
    {
        emojiChars: ':)',
        emoji: '🙂',
        sizeIncrease: 0,
        emojiTitle: 'zâmbet (ironic / inocent)'
    },
    {
        emojiChars: ':\'D',
        emoji: '😅',
        sizeIncrease: 0,
        emojiTitle: 'zâmbet cu dinți și sudoarea frunții'
    },
    {
        emojiChars: '=)',
        emoji: '😊',
        sizeIncrease: 0,
        emojiTitle: 'zâmbet drăguț'
    },
    {
        emojiChars: 'O)',
        emoji: '😇',
        sizeIncrease: 0,
        emojiTitle: 'zâmbet cu AURĂ DE ÎNGER'
    },
    {
        emojiChars: 'O:)',
        emoji: '😇',
        sizeIncrease: 0,
        emojiTitle: 'zâmbet cu AURĂ DE ÎNGER'
    },
    {
        emojiChars: 'D:',
        emoji: '🙃',
        sizeIncrease: 0,
        emojiTitle: 'zâmbet invers'
    },
    {
        emojiChars: ';)',
        emoji: '😉',
        sizeIncrease: 0,
        emojiTitle: 'face cu ochiu'
    },
    {
        emojiChars: '3D',
        emoji: '😍',
        sizeIncrease: 0,
        emojiTitle: 'are ochii rosii'
    },
    {
        emojiChars: ':*',
        emoji: '😗',
        sizeIncrease: 0,
        emojiTitle: 'pup fara INIMIOARA!'
    },
    {
        emojiChars: ';*',
        emoji: '😘',
        sizeIncrease: 0,
        emojiTitle: 'pup CU inimioara!! :DD'
    },
    {
        emojiChars: ':3',
        emoji: '😙',
        sizeIncrease: 0,
        emojiTitle: 'pup fara inimioara dar mai dragut'
    },
    {
        emojiChars: ':P',
        emoji: '😋',
        sizeIncrease: 0,
        emojiTitle: 'scoate limba'
    },
]

function replaceWithEmojis(input) {
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