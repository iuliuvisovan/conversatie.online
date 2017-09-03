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
        return isFemale;
    },
    getUserColor: (isFemale, room, users) => {
        var usersOfGenderCount = Object.keys(users)
            .filter(x => users[x].isFemale == isFemale && users[x].room == room).length;
        usersOfGenderCount -= 1;
        if (isFemale)
            return femaleColors[usersOfGenderCount % femaleColors.length];
        return maleColors[usersOfGenderCount % maleColors.length];
    },
    correctSentence: (sentence) => {
        sentence[0] = sentence[0].toUpperCase();
        sentence = sentence[0].toUpperCase() + sentence.substr(1);
        var validFinishCharacters = ['.', '!', '?'];
        if (validFinishCharacters.indexOf(sentence[sentence.length - 1]) < 0) {
            sentence += ".";
        }
        return sentence;
    },
    validateUserName: (userName, users, socketId) => {
        var existingUsersWithUsernameCount = 1;
        var myRoom = users[socketId].room;
        while (Object.keys(users).some(x => users[x].name &&
                users[x].name.toLowerCase().trim() == userName.toLowerCase().trim() &&
                users[x].room == myRoom &&
                users[x].socketId != socketId)) {
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
    }
}