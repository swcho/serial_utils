#!/usr/bin/node

var async = require('async');
var api = require('./index.js');
var path = require('path');

async.series([
    function(done) {
        api.init(function() {
            done();
        });
    },
    function(done) {
        api.list('/storage/external_storage/sda1/test_cases', function(err, list) {
            list.forEach(function(info) {
                if (path.extname(info.full_path) == '.xml') {
                    console.log(info.full_path);
                }
            });
            done();
        });
    }
], function() {
    process.exit();
});
