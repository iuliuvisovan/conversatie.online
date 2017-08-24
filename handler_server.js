var users = {};
var mongoose = require('mongoose');
var webpush = require('web-push');
var models = require('./models/models.js');

var handler = {
    init: (io) => {
        io.on('connection', socket => {
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
            socket.on('i am writing', () => {
                var message = {
                    socketId: socket.id.slice(2),
                    name: users[socket.id].name,
                    color: users[socket.id].color,
                    messageText: '...'
                };
                io.emit('user is writing', JSON.stringify(message));
            });
            socket.on('chat message', msg => {
                var message = {
                    socketId: socket.id.slice(2),
                    name: users[socket.id].name,
                    color: users[socket.id].color,
                    messageText: correctSentence(msg.trim())
                };
                io.emit('chat message', JSON.stringify(message));
            });
            socket.on('subscribe', subscription => {
                var userId = JSON.parse(subscription).userId;
                var pushMessageSubscription = JSON.parse(subscription).pushMessageSubscription;
                addOrUpdateModel(new models.pushMessageSubscription({
                    userId: userId,
                    subscription: JSON.stringify(pushMessageSubscription)
                }), 'pushMessageSubscription', {})

                console.log(JSON.stringify(pushMessageSubscription));

                users[socket.id].userId = userId;

                models.pushMessageSubscription.find({}, (error, subscriptions) => {
                    subscriptions.forEach(subscription => {
                        var subscription = subscription.subscription.replace(/\\/g, '');
                        var subscription = JSON.parse(subscription);
                        
                        console.log("#############");
                        console.log(subscription.endpoint);
                        console.log("#############");
                        webpush.sendNotification(subscription, '');
                    })
                })
            });
            socket.on('disconnect', function () {
                try {
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
    name = name.toLowerCase().trim();
    var hardcoded = ['Zoe', 'Mimi',  'Beatrice', 'Alice', 'Gyongy', 'Cami', 'Demi', 'Paula', 'Lady', 'Megan', 'Ada', 'Bianca', 'Camelia', 'Daciana', 'Adina', 'Bogdana', 'Casiana', 'Dana',
        'Adriana', 'Brandusa', 'Catinca', 'Daria', 'Agata', 'Catrinel', 'Delia', 'Alida', 'Catalina', 'Doina', 'Alina', 'Celia',
        'Dora', 'Amelia', 'Cezara', 'Dumitra', 'Ana', 'Clarisa', 'Anca', 'Codrina', 'Codruta', 'Anda', 'Corina', 'Andreea',
        'Lolo', 'Crenguta', 'Anemona', 'Cristina', 'Anica', 'Anuta', 'Aura', 'Roxana', 'Roxy', 'Rox', 'Carmen', 'Cora', 'Lari'
    ];
    if (hardcoded.some(x => x.toLowerCase() == name))
        isFemale = true;
    if (name[name.length - 1] == 'a' || name[name.length - 1] == 'ă' || name[name.length - 1] == 'i')
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

function addOrUpdateModel(model, modelName) {
    // console.log("Attempting to save object: \n " + model);
    var query = {
        '_id': model._id
    };
    mongoose.model(modelName).findOneAndUpdate(query, model, {
        upsert: true
    }, function (error, doc) {
        if (error) {
            // console.log("Error occured when trying to add / update! " + error);
        } else {
            // console.log("Successfullly added / updated model to database.");
        }
    });
}

function removeById(modelName, id, response) {
    console.log("Attempting to remove " + modelName + " with ID " + id);
    mongoose.model(modelName).find({
        _id: id
    }).remove(function (error) {
        if (error) {
            console.log("Error removing item from database: " + error);
            response.status(500).send(error);
        } else {
            console.log("Success removing item from database.");
            response.status(200).send("Successfully removed model from database: id: " + id);
        }
    });
}

module.exports = handler;