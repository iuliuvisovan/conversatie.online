var femaleColors = ['#ec7ebd', '#f5c33b', '#af9cda', '#e68585'];
var maleColors = ['#54c7ec', '#a3ce71', '#7596c8', '#cfa588'];

var hadcodedFemaleNames = ['Zoe', 'Mimi', 'Beatrice', 'Alice', 'Gyongy', 'Cami', 'Demi', 'Paula', 'Lady', 'Megan', 'Ada', 'Bianca', 'Camelia', 'Daciana', 'Adina', 'Bogdana', 'Casiana', 'Dana',
    'Adriana', 'Brandusa', 'Catinca', 'Daria', 'Agata', 'Catrinel', 'Delia', 'Alida', 'Catalina', 'Doina', 'Alina', 'Celia',
    'Dora', 'Amelia', 'Cezara', 'Dumitra', 'Ana', 'Clarisa', 'Anca', 'Codrina', 'Codruta', 'Anda', 'Corina', 'Andreea',
    'Lolo', 'Crenguta', 'Anemona', 'Cristina', 'Anica', 'Anuta', 'Aura', 'Roxana', 'Roxy', 'Rox', 'Carmen', 'Cora', 'Lari'
];
var hardcodedMaleNames = ['Andrei', 'Vali', 'Muri', 'Danci', 'Iuli'];

module.exports = {
    isFemaleName: (name) => {
        var isFemale;
        name = name.toLowerCase().trim();

        if (hardcodedMaleNames.some(x => x.toLowerCase() == name))
            return false;
        if (hadcodedFemaleNames.some(x => x.toLowerCase() == name))
            isFemale = true;
        if (name[name.length - 1] == 'a' || name[name.length - 1] == 'ă' || name[name.length - 1] == 'i')
            isFemale = true;
        return !!isFemale;
    },
    getUserColor: (isFemale, room, users, userId) => {
        var usersOfGenderCount = Object.keys(users)
            .filter(x => users[x].isFemale == isFemale && users[x].room == room).length;
        usersOfGenderCount -= 1;

        //If there is an available color, return that
        var availableColor = (isFemale ? femaleColors : maleColors)
            .find(x => !Object.keys(users).some(y =>
                users[y].color == x &&
                users[y].room == room &&
                users[y].userId != userId &&
                users[y].isFemale == isFemale
            ));

        if (availableColor)
            return availableColor;

        if (isFemale) {
            return femaleColors[usersOfGenderCount % femaleColors.length];
        }

        return maleColors[usersOfGenderCount % maleColors.length];
    },
    validateUserName: (userName, users, userId) => {
        var existingUsersWithUsernameCount = 1;
        var myRoom = users[userId].room;
        while (Object.keys(users).some(x => users[x].name &&
                users[x].name.toLowerCase().trim() == userName.toLowerCase().trim() &&
                users[x].room == myRoom &&
                users[x].userId != userId)) {
            userName = userName.replace(`(${existingUsersWithUsernameCount - 1}) `, '');
            userName = `(${existingUsersWithUsernameCount}) ` + userName;
            existingUsersWithUsernameCount++;
        }

        if (userName.toLowerCase().trim() == 'iuliu32') {
            userName = 'Iuliu';
            var fakeIuliu = Object.keys(users).filter(x => users[x].name &&
                users[x].name.toLowerCase().trim() == 'iuliu').forEach(fakeIuliuKey => {
                console.log("#############");
                users[fakeIuliuKey].name = 'Nu am voie cu numele de Iuliu';
                console.log("#############");

            });
        }

        return userName;
    },
    correctMessage: (text, messageHistory, userId) => {
        //If it's an URL, don't correct it
        if (isValidURL(text))
            return text + " ";

        //If it ends with a '*', treat it as a corrective message
        if (text.trim().endsWith('*') && messageHistory.length) {
            text = text.replace('*', '');
            var targetMessage;
            //Iteration is reversed, so latest message has priority
            var validMessages = messageHistory
                .filter(x => x.userId == userId && !x.messageText.includes("isCorrective") && !isValidURL(x.messageText))
                .reverse()
                .slice(0, 4);
            for (var message of validMessages) {
                if (isLevensteinMatch(message.messageText.replace('<span style="font-weight: bold">', '').replace('</span>', ''), text)) {
                    targetMessage = message;
                    break;
                }
            }

            if (targetMessage) {
                var originalEndingCharacter = targetMessage.messageText.substr(-1);
                targetMessage.messageText = targetMessage.messageText
                    .replace('<span style="font-weight: bold">', '')
                    .replace('</span>', '');
                targetMessage.messageText = injectWordInSentence(targetMessage.messageText, text);
                if (targetMessage.messageText.substr(-1) != originalEndingCharacter)
                    targetMessage.messageText += originalEndingCharacter;

                return JSON.stringify({
                    isCorrective: true,
                    targetMessageId: targetMessage.messageId,
                    targetMessageReplacement: targetMessage.messageText
                });
            } else {
                text = text + '*';
            }
        }


        text[0] = text[0].toUpperCase();
        text = text[0].toUpperCase() + text.substr(1);
        var validFinishCharacters = ['.', '!', '?'];
        if (validFinishCharacters.indexOf(text[text.length - 1]) < 0) {
            text += ".";
        }
        return text;
    }
}

function isValidURL(str) {
    return str.match(/^((https?:\/\/)?[\w-]+(\.[\w-]+)+\.?(:\d+)?(\/\S*)?)/igm);
}

function injectWordInSentence(sentence, injectedWord) {
    var sentenceWords = sentence.split(" ");
    sentenceWords = sentenceWords.map((x, i) => isLevensteinMatch(x, injectedWord) ?
        i ?
        `<span style="font-weight: bold">${injectedWord}</span>` :
        `<span style="font-weight: bold">${injectedWord[0].toUpperCase() + injectedWord.substr(1)}</span>` :
        x);
    var newSentence = sentenceWords.join(" ");
    return newSentence;
}

function isLevensteinMatch(guessedValue, correctValue) {
    var isMatch = false;
    var guessedWords = guessedValue.split(" "); //Check individual words
    guessedWords.push(guessedValue); //Also check the entire word
    guessedWords.forEach(s1 => {
        s1 = s1
            .replace('.', '')
            .replace(',', '')
            .replace('?', '')
            .replace('*', '')
            .replace('!', '');
        var longer = s1;
        var shorter = correctValue;
        if (s1.length < correctValue.length) {
            longer = correctValue;
            shorter = s1;
        }
        var longerLength = longer.length;
        if (longerLength == 0) {
            return false;
        }
        if (((longerLength - editDistance(longer, shorter)) / parseFloat(longerLength)) > 0.7)
            isMatch = true;
    });
    return isMatch;
}

function editDistance(s1, s2) {
    s1 = s1.toLowerCase().trim();
    s2 = s2.toLowerCase().trim();

    var costs = new Array();
    for (var i = 0; i <= s1.length; i++) {
        var lastValue = i;
        for (var j = 0; j <= s2.length; j++) {
            if (i == 0)
                costs[j] = j;
            else {
                if (j > 0) {
                    var newValue = costs[j - 1];
                    if (s1.charAt(i - 1) != s2.charAt(j - 1))
                        newValue = Math.min(Math.min(newValue, lastValue),
                            costs[j]) + 1;
                    costs[j - 1] = lastValue;
                    lastValue = newValue;
                }
            }
        }
        if (i > 0)
            costs[s2.length] = lastValue;
    }
    return costs[s2.length];
}