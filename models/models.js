var mongoose = require('mongoose');
var Schema = mongoose.Schema;

exports.pushMessageSubscription = mongoose.model('pushMessageSubscription',
    new mongoose.Schema({
        userId: String,
        subscription: String
    }));