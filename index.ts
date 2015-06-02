
var serial_commander = require('serial_commander');

export function init(cb) {
    serial_commander.init('/dev/ttyS0', function() {
        cb();
    });
}

export function install_apk(path) {
    serial_commander.run_command('ll', function(line) {
    });
}

export function list(path) {
    serial_commander.run_command('ll ' + path, function(line) {
        console.log(line);
    });
}

