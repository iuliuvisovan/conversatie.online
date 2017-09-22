var users = {};
var messageHistory = {};
var recentlyDisconnected = [];
var mongoose = require('mongoose');
var webpush = require('web-push');
var YouTube = require('youtube-node');
var moment = require('moment');

var models = require('./models/models.js');
var helper = require('./common/helper.js');
var credentialStore = require('./credentials/credential-store.js');

var youTube = new YouTube();
youTube.setKey(credentialStore.getCredential('YT_API_KEY'));

function handleConnection(socket, io) {
    var me = {};

    //Triggered by the user when first entering the site / changing name / changing room
    socket.on('check in', async(message) => {
        message = JSON.parse(message);
        var userName = message.userName.substr(0, 20);
        var userId = message.userId;
        var room = message.userRoom;

        //Get me based on my userId
        me = users[userId];

        if (!me) {
            //Instantiate the user object
            users[userId] = {
                socketsCount: 1
            };
            me = users[userId];
            //If I already exist, increment the sockets count
        } else {
            me.socketsCount++;
        }

        //If user has no room, or it has changed it, trigger a join
        if (me.room != room) {
            //If already in another room, get out of there
            if (me.room)
                socket.leave(me.room);
            socket.join(room);
            me.room = room;
        }


        //Check for duplicate/not allowed (iuliu) names
        userName = helper.validateUserName(userName, users, userId);

        var message = {
            isFemale: helper.isFemaleName(userName),
            name: userName,
            messageText: " Bun venit, "
        };

        me.userId = userId;
        me.name = userName;
        me.isFemale = message.isFemale;
        message.color = helper.getUserColor(message.isFemale, room, users, userId);
        me.color = message.color;
        if (userId.includes('http')) {
            updateUser(room, userName, me.color, userId);
        }

        message.userId = me.userId;
        message.color = me.color;

        emitMessage('i am active', {});

        //Notify new room of join
        emitMessage('online users update', await getOnlineUsers(me.room));

        if (messageHistory[room])
            socket.emit('room history', JSON.stringify(messageHistory[room]));

        var recentlyDisconnectedMe;
        if (recentlyDisconnected[me.room])
            recentlyDisconnectedMe = recentlyDisconnected[me.room].some(x => x.userId == me.userId);

        if (recentlyDisconnectedMe || me.socketsCount > 1) {
            socket.emit('join', JSON.stringify(message));
            if (recentlyDisconnected[me.room])
                recentlyDisconnected[me.room] = recentlyDisconnected[me.room].filter(x => x.userId != userId);
        } else
            emitMessage('join', message);
    });
    socket.on('i am writing', () => {
        emitMessage('writing', {
            messageText: '...'
        });
    });
    socket.on('chat message', msg => {
        if (msg.length > 800 && !msg.includes('image/'))
            return;

        if (msg.toLowerCase().trim().startsWith("play ")) {
            getYoutubeVideoBySearchTerm(msg.toLowerCase().trim().slice(5))
                .then(ytLink => {
                    if (ytLink) {
                        msg = ytLink;
                    }

                    emitMessage('chat message', {
                        messageText: helper.correctMessage(msg.trim()),
                        messageUnixTime: +new Date()
                    });

                });
        } else {
            emitMessage('chat message', {
                messageText: helper.correctMessage(msg.trim(), messageHistory[me.room], me.userId),
                messageUnixTime: +new Date()
            });
        }
    });
    socket.on('sync media', message => {
        message = JSON.parse(message);

        emitMessage('sync media', message, undefined, true);
    });
    socket.on('i am active', () => {
        emitMessage('i am active', {});
    });
    socket.on('change name', async(name) => {
        var message = {
            oldName: me.name,
            name: name,
            messageText: " ⇒ "
        }
        me.name = name;
        emitMessage('join', message);
        emitMessage('online users update', await getOnlineUsers(me.room));
    });

    handlePwaSubscription(socket);

    socket.on('disconnect', () => {
        try {
            //If it had more windows open and just closed one of them => decrement the count and go home
            me.socketsCount--;
            if (me.socketsCount > 0 || !me.room) {
                return;
            }

            //Defer leave event for after 10 seconds, and only if not reconnected

            //Ensure list exists
            if (!recentlyDisconnected[me.room])
                recentlyDisconnected[me.room] = [];

            recentlyDisconnected[me.room].push(me);
            let myUserId = me.userId;
            let myRoom = me.room;
            setTimeout(async() => {
                let me = recentlyDisconnected[myRoom].find(x => x.userId == myUserId);

                //If removed from the list after less than 10 seconds, means he's reconnected
                if (!me)
                    return;


                //Remove me from the list of last disconnected
                recentlyDisconnected[me.room] = recentlyDisconnected[me.room].filter(x => x.userId != myUserId);
                emitMessage('leave', {
                    messageText: " s-a dus.",
                });
                var leftRoom = myRoom;
                me.room = "someGarbageRoflmao";
                var onlineUsers = await getOnlineUsers(myRoom);
                me.room = leftRoom;
                emitMessage('online users update', onlineUsers, myRoom);

                delete users[myUserId];
            }, 5000);

        } catch (e) {
            console.log(e);
            delete users[me.userId];
        }
    });

    var emitMessage = (eventName, message, requestedRoom, isYoutubeVideo) => {
        message.userId = me.userId;
        message.name = me.name;
        message.color = me.color;
        if (!isYoutubeVideo)
            message.messageId = "chatMessage" + +new Date();
        var room = me.room;
        if (requestedRoom)
            room = requestedRoom;
        console.log(`#${room} - Emitting [${eventName}]`);
        socket.join(room);
        io.in(room).emit(eventName, JSON.stringify(message));

        //Emit push notification if eventName is 'chat message'
        if (eventName == 'chat message') {
            //Find all subscriptions and send a message to them!
            if (!message.messageText.includes('isCorrective')) {
                sendNotificationsToRoom(room, message);
            }

            if (!messageHistory[room])
                messageHistory[room] = [];
            messageHistory[room].push(message);
            messageHistory[room].slice(1, 100);
        }
    };
}


if (credentialStore.getCredential("IS_PRODUCTION")) {
    process.on('uncaughtException', err => {
        console.error(err.stack);
        console.log("Node NOT Exiting...");
    });
}


var cachedSubscriptions = [];

var getOnlineUsers = async(room) => {
    var onlineActiveUsers = Object.keys(users)
        .filter(x => users[x].room == room)
        .map(x => users[x]);

    var onlineInactiveUsers = await models.pushMessageSubscription.find({
        'currentRoom': room
    });
    return [...onlineActiveUsers, ...onlineInactiveUsers
        .filter(x => !onlineActiveUsers.some(y => y.userId == x.userId))
        .map(x => ({
            userId: x.userId,
            name: x.currentName,
            color: x.currentColor,
            isInActive: true
        }))
    ];
}

function sendNotificationsToRoom(room, notification) {
    if (notification.messageText.includes(":image"))
        notification.messageText = "[Imagine]";

    //Use the cached ones if exist
    if (cachedSubscriptions.length)
        cachedSubscriptions.forEach(x => sendNotificationToSubscription(x, notification));
    else
        //Query the DB for the subscriptions
        models.pushMessageSubscription.find({
            'currentRoom': room
        }, (error, subscriptions) => {
            subscriptions.forEach(subscription => {
                //Cache them
                cachedSubscriptions = subscriptions;
                sendNotificationToSubscription(subscription, notification);
            })
        })
}

function sendNotificationToSubscription(subscription, notification) {
    //This. Is. Horrible. But it works so don't touch it.
    var subscription = subscription.subscription.replace(/\\/g, '');
    var subscription = JSON.parse(subscription);



    webpush.sendNotification(subscription, JSON.stringify(notification));
}

function updateUser(newRoom, newName, newColor, userId) {
    mongoose.model('pushMessageSubscription').findOneAndUpdate({
        "userId": userId,
    }, {
        "$set": {
            "currentRoom": newRoom,
            "currentName": newName,
            "currentColor": newColor,
        }
    }, {
        new: true,
        upsert: true
    }, (err, doc) => {
        if (err)
            throw err; // handle error;
    });
    cachedSubscriptions = [];
}

//Adds or updates a model based on whether it has a 
function addOrUpdateModel(model, modelName) {
    console.log("Attempting to save object: \n " + model);
    var query = {
        '_id': model._id
    };
    mongoose.model(modelName).findOneAndUpdate(query, model, {
        upsert: true
    }, (error, doc) => {
        if (error) {
            console.log("Error occured when trying to add / update! " + error);
        } else {
            console.log("Successfullly added / updated model to database.");
        }
    });
}

function removeById(modelName, id, response) {
    console.log("Attempting to remove " + modelName + " with ID " + id);
    mongoose.model(modelName).find({
        _id: id
    }).remove(error => {
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
        cachedSubscriptions = [];
        var userId = JSON.parse(subscription).userId;
        var pushMessageSubscription = JSON.parse(subscription).pushMessageSubscription;
        addOrUpdateModel(new models.pushMessageSubscription({
            userId: userId,
            currentRoom: "",
            subscription: JSON.stringify(pushMessageSubscription)
        }), 'pushMessageSubscription', {})

        console.log(JSON.stringify(pushMessageSubscription));
    });
}

function getYoutubeVideoBySearchTerm(searchTerm) {
    return new Promise((resolve, reject) => {
        if (searchTerm == 'trending') {
            youTube.search('', 20, {
                type: 'video',
                chart: 'mostPopular',
                publishedAfter: moment().subtract(3, 'months').format()
            }, (error, result) => {
                resolve('https://www.youtube.com/watch?v=' + result.items[new Date() % 20].id.videoId);
            });
        } else {
            youTube.search(searchTerm, 1, {
                type: 'video'
            }, (error, result) => {
                if (result.items[0])
                    resolve('https://www.youtube.com/watch?v=' + result.items[0].id.videoId);
                else
                    resolve('');
            });
        }
    });

}

var handler = {
    init: (io) => {
        //Triggered automatically by the client framework
        io.on('connection', socket => handleConnection(socket, io));
    }
};

function escapeRegExp(text) {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
}

module.exports = handler;