var serial_commander = require('serial_commander');
function init(cb) {
    serial_commander.init('/dev/ttyS0', function () {
        cb();
    });
}
exports.init = init;
function install_apk(path) {
    serial_commander.run_command('ll', function (line) {
    });
}
exports.install_apk = install_apk;
function list(path) {
    serial_commander.run_command('ll ' + path, function (line) {
        console.log(line);
    });
}
exports.list = list;
//# sourceMappingURL=index.js.map