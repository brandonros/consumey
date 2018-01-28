var Promise = require('bluebird');
var net = require('net');
var ndjson = require('ndjson');
var EventEmitter = require('events');
var util = require('util');

var Consumer = function(ip, port, channel, handleJob) {
  var self = this;
  
  self.socket = new net.Socket();

  var jsonStream = ndjson.parse();

  self.socket.pipe(jsonStream);

  jsonStream.on('data', function(message) {
    self.emit(message.action, message.parameters);
  });

  self.on('job', function(parameters) {
    self.socket.write(JSON.stringify({action: 'start', parameters: {jobId: parameters.jobId}}) + '\n');

    var result = handleJob(parameters);

    self.socket.write(JSON.stringify({action: 'finish', parameters: {jobId: parameters.jobId, result: result}}) + '\n');
  });

  self.socket.connect(port, ip);

  self.socket.write(JSON.stringify({action: 'subscribe', parameters: {channel: channel}}) + '\n');
};

util.inherits(Consumer, EventEmitter);

module.exports = Consumer;
