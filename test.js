#!/usr/bin/node

var api = require('./index.js');

api.init(function() {
    api.list('/storage/external_storage/sda1', function(err, list) {
        console.log(list);
        process.exit();
    });
});