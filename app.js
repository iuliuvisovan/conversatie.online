var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
var webpush = require('web-push');
var credentialStore = require('./credentials/credential-store.js');

var routes = require('./routes/index');

var app = express();

var isProduction = credentialStore.getCredential("IS_PRODUCTION");

if (isProduction) {
  mongoose.connect(credentialStore.getCredential("MONGODB_URI"), {
    useMongoClient: true
  });
}

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: false
}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

//Redirect http trafic to https domain
if (isProduction) {
  app.use((req, res, next) => {
    if (!req.secure) {
      //FYI this should work for local development as well
      return res.redirect('https://' + req.get('host') + req.url);
    }
    next();
  });
}

app.use('/', routes);


// VAPID keys should only be generated only once.
const vapidKeys = webpush.generateVAPIDKeys();

webpush.setGCMAPIKey('<Your GCM API Key Here>');
webpush.setVapidDetails(
  'mailto:example@yourdomain.org',
  'BMEi_ez0hgDxewidO83qBFenXDfkie8kQmfPnj1AJBsZ9EqgywI5Oo3yK5i6Xp0DMYlHNCEBvF0ayUk2f1PUsD0',
  'iL0FM_G9eJhla43rNK86K0Bzm2DkHqHrL3qVRPF-aZ8'
);


module.exports = app;