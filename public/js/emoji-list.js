var emojiMatchPairs = [
    ...Array.from(new Array(9)).map((x, i) => {
        return {
            emojiChars: ':o3' + '3'.repeat(i),
            emoji: '🐶',
            sizeIncrease: i * 5,
            emojiTitle: 'cățăl'
        }
    }).reverse(),
    {
        emojiChars: ':caca',
        emoji: '💩',
        sizeIncrease: 0,
        emojiTitle: 'caca'
    },
    {
        emojiChars: ':catd',
        emoji: '😸',
        sizeIncrease: 0,
        emojiTitle: ''
    },
    {
        emojiChars: ':cat))',
        emoji: '😹',
        sizeIncrease: 0,
        emojiTitle: ''
    },
    {
        emojiChars: ':catx',
        emoji: '😻',
        sizeIncrease: 0,
        emojiTitle: ''
    },
    {
        emojiChars: '>:cat)',
        emoji: '😼',
        sizeIncrease: 0,
        emojiTitle: ''
    },
    {
        emojiChars: '(Y)',
        emoji: '👍',
        sizeIncrease: 0,
        emojiTitle: ''
    },
    {
        emojiChars: ':buze',
        emoji: '💋',
        sizeIncrease: 0,
        emojiTitle: 'pup cu buze'
    },
    {
        emojiChars: ':limba',
        emoji: '👅',
        sizeIncrease: 0,
        emojiTitle: 'limba'
    },
    {
        emojiChars: ':moscraciuntagan',
        emoji: '🎅🏾',
        sizeIncrease: 0,
        emojiTitle: 'moș crăciun țâgan'
    },
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
     {
        emojiChars: '😛',
        emoji: ':DP',
        sizeIncrease: 0,
        emojiTitle: 'scoate limba cu gura deschisă'
    },
    ...Array.from(new Array(9)).map((x, i) => {
        return {
            emojiChars: ':D' + 'D'.repeat(i),
            emoji: '😁',
            sizeIncrease: i * 5,
            emojiTitle: 'zâmbet cu dinți'
        }
    }).reverse(),
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
        emojiChars: ':X',
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
    {
        emojiChars: ';P',
        emoji: '😜',
        sizeIncrease: 0,
        emojiTitle: 'scoate limba fără un ochi'
    },
    {
        emojiChars: '>P',
        emoji: '😝',
        sizeIncrease: 0,
        emojiTitle: 'scoate limba fără ochi'
    },
   
    {
        emojiChars: '$)',
        emoji: '🤑',
        sizeIncrease: 0,
        emojiTitle: 'ii plac banii'
    },
    {
        emojiChars: '🤗',
        emoji: '>:D',
        sizeIncrease: 0,
        emojiTitle: 'HUG'
    },
    {
        emojiChars: '8)',
        emoji: '😎',
        sizeIncrease: 0,
        emojiTitle: 'cul'
    },
    {
        emojiChars: ':>',
        emoji: '😏',
        sizeIncrease: 0,
        emojiTitle: 'mmmm'
    },
    {
        emojiChars: '-.-',
        emoji: '😒',
        sizeIncrease: 0,
        emojiTitle: '-.-'
    },
     ...Array.from(new Array(9)).map((x, i) => {
        return {
            emojiChars: ':((' + '('.repeat(i),
            emoji: '😭',
            sizeIncrease: i * 5,
            emojiTitle: 'plange grav saracu'
        }
    }).reverse(),
    {
        emojiChars: ':(',
        emoji: '😞',
        sizeIncrease: 0,
        emojiTitle: 'tristuț'
    },
    {
        emojiChars: '=(',
        emoji: '😔',
        sizeIncrease: 0,
        emojiTitle: 'mai tristuț'
    },
    {
        emojiChars: ':/',
        emoji: '😕 ',
        sizeIncrease: 0,
        emojiTitle: ':/'
    },
    {
        emojiChars: '>(',
        emoji: '😣',
        sizeIncrease: 0,
        emojiTitle: 'tristut cu ochii inchisi'
    },
    {
        emojiChars: 'X(',
        emoji: '😡',
        sizeIncrease: 0,
        emojiTitle: 'nervos'
    },
    {
        emojiChars: ':|',
        emoji: '😐',
        sizeIncrease: 0,
        emojiTitle: ':|'
    },
    {
        emojiChars: '=|',
        emoji: '😑',
        sizeIncrease: 0,
        emojiTitle: ':|'
    },
    {
        emojiChars: 'O_O',
        emoji: '😳',
        sizeIncrease: 0,
        emojiTitle: ''
    },
    {
        emojiChars: ':OO',
        emoji: '😱',
        sizeIncrease: 0,
        emojiTitle: 'scared'
    },
    {
        emojiChars: ':O',
        emoji: '😲',
        sizeIncrease: 0,
        emojiTitle: 'oooo'
    },
    {
        emojiChars: ':boo',
        emoji: '👻',
        sizeIncrease: 0,
        emojiTitle: 'fantoma'
    },
    {
        emojiChars: ':c',
        emoji: '☹️',
        sizeIncrease: 0,
        emojiTitle: 'trist cu fata lunga'
    },
    {
        emojiChars: ':\'(',
        emoji: '😢',
        sizeIncrease: 0,
        emojiTitle: 'trist cu lacrima'
    },
    {
        emojiChars: ':\'',
        emoji: '😪',
        sizeIncrease: 0,
        emojiTitle: 'lacrima'
    },
    {
        emojiChars: ':zz',
        emoji: '😴',
        sizeIncrease: 0,
        emojiTitle: 'somn'
    },
    {
        emojiChars: ':-?',
        emoji: '🤔',
        sizeIncrease: 0,
        emojiTitle: 'se gânde'
    },
    {
        emojiChars: ':--',
        emoji: '🤥',
        sizeIncrease: 0,
        emojiTitle: 'mincinos'
    },
    {
        emojiChars: ':$',
        emoji: '🤐',
        sizeIncrease: 0,
        emojiTitle: 'gata, am tacut'
    },
    {
        emojiChars: ':(x',
        emoji: '🤢',
        sizeIncrease: 0,
        emojiTitle: ''
    },
    {
        emojiChars: '>:)',
        emoji: '😈',
        sizeIncrease: 0,
        emojiTitle: 'muahaha'
    },
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
]