var users = {};

var handler = {
    init: function (io) {
        io.on('connection', function (socket) {
            socket.on('check-in', function (msg) {
                console.log('connect');
                if (!msg)
                    return;
                if (users[socket.id])
                    var isNameChange = true;
                else
                    users[socket.id] = {};

                var message = {
                    socketId: socket.id.slice(2),
                    name: msg,
                    oldName: users[socket.id].name,
                    isFemale: isFemaleName(msg),
                    color: getRandomColor(isFemaleName(msg)),
                    messageText: isNameChange ?
                        " a devenit " : " ni s-a alăturat!"
                };
                users[socket.id].name = msg;
                users[socket.id].color = message.color;
                io.emit('join', JSON.stringify(message));
            });
            socket.on('chat message', function (msg) {
                var message = {
                    socketId: socket.id.slice(2),
                    name: users[socket.id].name,
                    color: users[socket.id].color,
                    messageText: correctSentence(msg.trim())
                };
                io.emit('chat message', JSON.stringify(message));
            });
            socket.on('disconnect', function () {
                try {
                    console.log('disconnect');
                    var msg = users[socket.id];
                    var message = {
                        name: msg.name,
                        isFemale: isFemaleName(msg),
                        messageText: " s-a dus.",
                        color: users[socket.id].color
                    };
                    io.emit('leave', JSON.stringify(message));
                    delete users[socket.id];
                } catch (e) {
                    console.log(e);
                }
            });
        });
    }
};


function isFemaleName(name) {
    var isFemale;
    var hardcoded = ['Demi', 'Paula', 'Lady', 'Megan', 'Ada', 'Bianca', 'Camelia', 'Daciana', 'Adina', 'Bogdana', 'Casiana', 'Dana',
        'Adriana', 'Brandusa', 'Catinca', 'Daria', 'Agata', 'Catrinel', 'Delia', 'Alida', 'Catalina', 'Doina', 'Alina', 'Celia',
        'Dora', 'Amelia', 'Cezara', 'Dumitra', 'Ana', 'Clarisa', 'Anca', 'Codrina', 'Codruta', 'Anda', 'Corina', 'Andreea',
        'Lolo', 'Crenguta', 'Anemona', 'Cristina', 'Anica', 'Anuta', 'Aura', 'Roxana', 'Roxy', 'Rox', 'Carmen', 'Cora', 'Lari'
    ];
    if (hardcoded.indexOf(name) >= 0)
        isFemale = true;
    if (name[name.length - 1] == 'a' || name[name.length - 1] == 'ă')
        isFemale = true;
    return isFemale;
}

var femaleColors = ['#f44336', '#e91e63', '#9c27b0', '#03a9f4', '#f9a825', '#ff8a65'];
var maleColors = ['#3f51b5', '#4885a3 ', '#009688', '#43A047'];

function getRandomColor(isFemale) {
    if (isFemale) {
        var color = femaleColors[new Date() % femaleColors.length];
        if (isColorUsed(color))
            color = femaleColors[new Date() % femaleColors.length];
        if (isColorUsed(color))
            color = femaleColors[new Date() % femaleColors.length];
        return color;
    }
    var color = maleColors[new Date() % maleColors.length];
    if (isColorUsed(color))
        color = maleColors[new Date() % maleColors.length];
    if (isColorUsed(color))
        color = maleColors[new Date() % maleColors.length];
    return color;
}

function isColorUsed(color) {
    return Object.keys(users).some(x => users[x].color == color);
}

function correctSentence(sentence) {
    sentence[0] = sentence[0].toUpperCase();
    sentence = sentence[0].toUpperCase() + sentence.substr(1);
    var validFinishCharacters = ['.', '!', '?'];
    if (validFinishCharacters.indexOf(sentence[sentence.length - 1]) < 0) {
        sentence += ".";
    }
    return sentence;
}

module.exports = handler;