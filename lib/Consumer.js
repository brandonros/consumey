var Promise = require('bluebird');
var net = require('net');
var ndjson = require('ndjson');
var EventEmitter = require('events');
var util = require('util');

var Consumer = function(ip, port, channel) {
  var self = this;
  
  self.socket = new net.Socket();

  var jsonStream = ndjson.parse();

  self.socket.pipe(jsonStream);

  jsonStream.on('data', function(message) {
    self.emit(message.action, message.parameters);
  });

  self.socket.connect(port, ip);
};

Consumer.prototype.subscribe = function(channel) {
  var self = this;

  self.socket.write(JSON.stringify({action: 'subscribe', parameters: {channel: channel}}) + '\n');
};

Consumer.prototype.start = function(jobId) {
  var self = this;

  self.socket.write(JSON.stringify({action: 'start', parameters: {jobId: jobId}}) + '\n');
};

Consumer.prototype.finish = function(jobId, result) {
  var self = this;

  self.socket.write(JSON.stringify({action: 'finish', parameters: {jobId: jobId, result: result}}) + '\n');
};

util.inherits(Consumer, EventEmitter);

module.exports = Consumer;
