var Promise = require('bluebird');

var Consumer = require('../lib/consumer.js');

(async function() {
  var consumer = new Consumer('127.0.0.1', 1337, 'work', function(parameters) {
    console.log(parameters);

    return {
      sucesss: true
    };
  });
})();

process.on('unhandledRejection', function(err) {
  console.error(err.stack);
  process.exit(1);
});