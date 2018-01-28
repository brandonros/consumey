var Promise = require('bluebird');
var net = require('net');
var ndjson = require('ndjson');
var moment = require('moment');
var EventEmitter = require('events');
var util = require('util');

var Server = function(ip, port) {
  var self = this;

  self.clients = {};
  self.clientChannels = {};
  self.channels = {};
  self.jobs = {};

  self.jobStatuses = {
    dispatched: {},
    started: {},
    finished: {}
  };

  self.socket = net.createServer();

  self.socket.on('connection', function(client) {
    self.emit('open', {client: client});
  });

  self.on('open', function(parameters) {
    var clientKey = `${parameters.client.remoteAddress}:${parameters.client.remotePort}`;

    self.clients[clientKey] = parameters.client;

    parameters.client.on('error', function() {
      self.emit('close', {clientKey: clientKey});
    });

    parameters.client.on('close', function() {
      self.emit('close', {clientKey: clientKey});
    });

    var jsonStream = ndjson.parse();

    parameters.client.pipe(jsonStream);

    jsonStream.on('data', function(message) {
      console.log(clientKey, message.action, message.parameters);

      self.emit(message.action, Object.assign({}, {clientKey: clientKey}, message.parameters));
    });
  });

  self.on('close', function(parameters) {
    if (self.clientChannels[parameters.clientKey]) {
      var clientChannelKeys = Object.keys(self.clientChannels[parameters.clientKey]);

      clientChannelKeys.forEach(function(clientChannelKey) {
        delete self.channels[clientChannelKey].clients[parameters.clientKey];
      });

      delete self.clientChannels[parameters.clientKey];
    }

    delete self.clients[parameters.clientKey];
  });

  self.on('subscribe', function(parameters) {
    if (!self.channels[parameters.channel]) {
      self.channels[parameters.channel] = {
        clients: {},
        nextClientIndex: 0
      };
    }

    if (!self.clientChannels[parameters.clientKey]) {
      self.clientChannels[parameters.clientKey] = {};
    }

    self.channels[parameters.channel].clients[parameters.clientKey] = true;
    self.clientChannels[parameters.clientKey][parameters.channel] = true;
  });

  self.on('start', function(parameters) {
    self.jobs[parameters.jobId].started = moment().format();
    self.jobs[parameters.jobId].status = 'started';

    self.jobStatuses.started[parameters.jobId] = true;
    delete self.jobStatuses.dispatched[parameters.jobId];
  });

  self.on('finish', function(parameters) {
    self.jobs[parameters.jobId].finished = moment().format();
    self.jobs[parameters.jobId].result = parameters.result;
    self.jobs[parameters.jobId].status = 'finished';

    self.jobStatuses.finished[parameters.jobId] = true;
    delete self.jobStatuses.started[parameters.jobId];
  });

  self.on('job', function(parameters) {
    var channelClientKeys = Object.keys(self.channels[parameters.channel].clients);
    var nextClientKey = channelClientKeys[self.channels[parameters.channel].nextClientIndex];

    self.jobs[parameters.jobId] = {
      jobId: parameters.jobId,
      channel: parameters.channel,
      producer: parameters.clientKey,
      dispatched: moment().format(),
      data: parameters.data,
      status: 'dispatched',
      consumer: nextClientKey
    };

    self.jobStatuses.dispatched[parameters.jobId] = true;

    self.clients[nextClientKey].write(JSON.stringify({action: 'job', parameters: self.jobs[parameters.jobId]}) + '\n');

    self.channels[parameters.channel].nextClientIndex += 1;

    if (self.channels[parameters.channel].nextClientIndex >= channelClientKeys.length) {
      self.channels[parameters.channel].nextClientIndex = 0;
    }
  });

  self.socket.listen(port, ip, function() {
    console.info(`Listening on ${port}`);
  });

  setInterval(function() {
    console.log(JSON.stringify({
      clients: Object.keys(self.clients),
      channels: self.channels,
      jobs: self.jobs,
      jobStatuses: self.jobStatuses
    }));
  }, 1000);
};

util.inherits(Server, EventEmitter);

module.exports = Server;

