var Promise = require('bluebird');
var net = require('net');
var ndjson = require('ndjson');
var EventEmitter = require('events');
var util = require('util');

var Producer = function(ip, port) {
  var self = this;
  
  self.socket = new net.Socket();

  var jsonStream = ndjson.parse();

  self.socket.pipe(jsonStream);

  jsonStream.on('data', function(message) {
    self.emit(message.action, message.parameters);
  });

  self.on('job', function(parameters) {
    console.log('Sending job', parameters);

    self.socket.write(JSON.stringify({action: 'job', parameters: parameters}) + '\n');
  });

  self.socket.connect(port, ip);
};

util.inherits(Producer, EventEmitter);

module.exports = Producer;