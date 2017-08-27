var users = {};
var mongoose = require('mongoose');
var webpush = require('web-push');
var models = require('./models/models.js');
var helper = require('./common/helper.js');

//List of rooms, that grows as users request non-existing ones
var rooms = [];

var handler = {
    init: (io) => {
        //Triggered automatically by the client framework
        io.on('connection', socket => {
            //Triggered by the user when first entering the site / changing name / changing room
            socket.on('check-in', message => {
                message = JSON.parse(message);
                var userName = message.userName;
                var newRoom = message.userTopic;
                if (!rooms.includes(newRoom))
                    rooms.push(newRoom);
                if (!userName)
                    return;

                //If user exists, check if it's in the same room. If yes, consider it a name change
                if (users[socket.id]) {
                    if (users[socket.id].room == newRoom)
                        var isNameChange = true;
                } else
                    //Instantiate the user object
                    users[socket.id] = {};

                var oldRoom = users[socket.id].room;

                //If nothing's changed, don't do anything
                if (users[socket.id].name == userName && (oldRoom == newRoom))
                    return;

                //If user has no room, or it has changed it, trigger a join
                if (!users[socket.id] || users[socket.id].room != newRoom) {
                    //If already in another room, get out of there
                    if (users[socket.id])
                        socket.leave(users[socket.id].room);
                    socket.join(newRoom);
                }

                users[socket.id].room = newRoom;
                //Check for duplicate/not allowed (iuliu) names
                userName = helper.validateUserName(userName, users, socket.id);

                var message = {
                    oldName: isNameChange ? users[socket.id].name : '',
                    isFemale: helper.isFemaleName(userName),
                    name: userName,
                    messageText: isNameChange ? " a devenit " : " Bun venit, "
                };

                users[socket.id].socketId = socket.id;
                users[socket.id].name = userName;
                users[socket.id].isFemale = message.isFemale;
                message.color = helper.getUserColor(message.isFemale, newRoom, users);
                users[socket.id].color = message.color;

                message.socketId = socket.id.split("#")[1];
                if (isNameChange)
                    message.name = users[socket.id].name;
                message.color = users[socket.id].color;

                //Notify new room of join
                emitMessage('online-users-update', Object.keys(users)
                    .filter(x => users[x].room == newRoom)
                    .map(x => users[x]), newRoom);
                emitMessage('join', message, newRoom);

                if (oldRoom && (oldRoom != newRoom)) {
                    //Notify old room of leave
                    message.messageText = " s-a dus.";
                    emitMessage('leave', message, oldRoom);
                    emitMessage('online-users-update', Object.keys(users)
                        .filter(x => users[x].room == oldRoom)
                        .map(x => users[x]), oldRoom);
                }
            });
            socket.on('i am writing', () => {
                emitMessage('writing', {
                    messageText: '...'
                });
            });
            socket.on('chat message', msg => {
                if (msg.length > 300)
                    return;

                emitMessage('chat message', {
                    messageText: helper.correctSentence(msg.trim()),
                    messageUnixTime: +new Date()
                });
            });
            socket.on('sync-media', message => {
                emitMessage('sync-media', JSON.parse(message));
            });

            handlePwaSubscription(socket);

            socket.on('disconnect', () => {
                try {
                    emitMessage('leave', {
                        messageText: " s-a dus.",
                    });
                    var room = users[socket.id].room;
                    emitMessage('online-users-update', Object.keys(users)
                        .filter(x => users[x].room == room &&
                            users[x].socketId != socket.id)
                        .map(x => users[x]));

                    delete users[socket.id];
                } catch (e) {
                    console.log(e);
                    delete users[socket.id];
                }
            });

            var emitMessage = (eventName, message, requestedRoom) => {
                message.socketId = socket.id.split("#")[1];
                message.name = users[socket.id].name;
                message.color = users[socket.id].color;
                var room = users[socket.id].room;
                console.log(users[socket.id]);
                if (requestedRoom)
                    room = requestedRoom;
                console.log(`Emitting ${eventName} in room ${room}`);
                io.in(room).emit(eventName, JSON.stringify(message));
            };

        });
    }
};

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

function handlePwaSubscription(socket) {
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
}

module.exports = handler;