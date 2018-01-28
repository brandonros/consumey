var Promise = require('bluebird');
var uuid = require('uuid');

var Producer = require('../lib/Producer.js');

(async function() {
  var producer = new Producer('127.0.0.1', 1337);

  for (var i = 0; i < 10; ++i) {
    producer.emit('job', {
      jobId: uuid.v4(),
      channel: 'work',
      data: {
        hello: 'world',
        i: i
      }
    });
  }
})();

process.on('unhandledRejection', function(err) {
  console.error(err.stack);
  process.exit(1);
});