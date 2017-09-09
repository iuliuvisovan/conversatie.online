module.exports = {
    getCredential: (key) => process.env[key] || require('./credentials.js')[key]
}