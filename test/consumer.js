var Promise = require('bluebird');

var Consumer = require('../lib/Consumer.js');

function getRandomNumber(minimum, maximum) {
  return Math.floor(Math.random() * (maximum - minimum + 1)) + minimum;
}

async function handleJob(parameters) {
  await Promise.delay(getRandomNumber(1000, 5000));
  
  return {
    success: true
  };
}

(async function() {
  var consumer = new Consumer('127.0.0.1', 1337);

  consumer.subscribe('work');

  consumer.on('job', function(parameters) {
    consumer.start(parameters.jobId);

    handleJob(parameters)
    .then(function(result) {
      consumer.finish(parameters.jobId, result);
    })
    .catch(function(err) {
      consumer.finish(parameters.jobId, {error: err.message});
    });
  });
})();

process.on('unhandledRejection', function(err) {
  console.error(err.stack);
  process.exit(1);
});