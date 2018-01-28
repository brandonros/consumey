var Promise = require('bluebird');

var Server = require('../lib/server.js');

(async function() {
  var server = new Server('127.0.0.1', 1337);
})();

process.on('unhandledRejection', function(err) {
  console.error(err.stack);
  process.exit(1);
});