#!/usr/bin/node

var api = require('./index.js');

api.init(function() {
    api.list('/storage/external_storage/sda1');
});