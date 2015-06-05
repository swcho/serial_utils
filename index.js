/// <reference path='typings/tsd.d.ts' />
var serial_commander = require('serial_commander');
function init(cb) {
    serial_commander.init('/dev/ttyS0', function () {
        cb();
    });
}
exports.init = init;
function list(aPath, aCb) {
    var re_dir = /(\S+)\s+(\S+)\s+(\S+)\s+(\S+)\s+(\S+)\s+(.*)/;
    var re_file = /(\S+)\s+(\S+)\s+(\S+)\s+(\S+)\s+(\S+)\s+(\S+)\s+(.*)/;
    var file_info_list = [];
    serial_commander.run_command('ll ' + aPath, function (line) {
        var is_dir;
        var filename;
        var path;
        var full_path;
        var size;
        var time;
        function to_time(str_date, str_time) {
            var split_date = str_date.split('-');
            var split_time = str_time.split(':');
            return new Date(parseInt(split_date[0], 10), parseInt(split_date[1], 10) - 1, parseInt(split_date[2], 10), parseInt(split_time[0], 10), parseInt(split_time[1], 10));
        }
        if (line[0] === 'd') {
            var match = re_dir.exec(line);
            if (match) {
                is_dir = true;
                filename = match[6];
                path = aPath;
                full_path = path + '/' + filename;
                size = 0;
                time = to_time(match[4], match[5]);
            }
        }
        else {
            var match = re_file.exec(line);
            if (match) {
                is_dir = false;
                filename = match[7];
                path = aPath;
                full_path = path + '/' + filename;
                size = parseInt(match[4]);
                time = to_time(match[5], match[6]);
            }
        }
        if (filename) {
            file_info_list.push({
                is_dir: is_dir,
                filename: filename,
                path: path,
                full_path: full_path,
                size: size,
                time: time
            });
        }
    }, function (err) {
        aCb(err, file_info_list);
    });
}
exports.list = list;
function install_apk(path) {
    serial_commander.run_command('ll', function (line) {
    });
}
exports.install_apk = install_apk;
//# sourceMappingURL=index.js.map