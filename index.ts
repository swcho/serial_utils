
/// <reference path='typings/tsd.d.ts' />

var serial_commander = require('serial_commander');

export function init(cb) {
    serial_commander.init('/dev/ttyS0', function() {
        cb();
    });
}

export interface TFileInfo {
    is_dir: boolean;
    filename: string;
    path: string;
    full_path: string;
    size: number;
    time: Date;
}

export function debug_run_command(aCommand, aCb: (err: any) => void) {
    console.log('debug_run_command: ' + aCommand);
    serial_commander.run_command(aCommand, function(line) {
        console.log('O: ' + line);
    }, function(errLine) {
        console.log('E: ' + errLine);
    }, function(exitCode) {
        console.log('F: ' + exitCode);
        aCb(exitCode);
    });
}

/**
 *
 * @param aPath
 * @param aCb
 */
export function list(aPath: string, aCb: (err: any, file_info_list: TFileInfo[]) => void) {
    var re_dir = /(\S+)\s+(\S+)\s+(\S+)\s+(\S+)\s+(\S+)\s+(.*)/;
    var re_file = /(\S+)\s+(\S+)\s+(\S+)\s+(\S+)\s+(\S+)\s+(\S+)\s+(.*)/;

    var file_info_list: TFileInfo[] = [];
    serial_commander.run_command('ll ' + aPath, function(line) {
        var is_dir: boolean;
        var filename: string;
        var path: string;
        var full_path: string;
        var size: number;
        var time: Date;

        function to_time(str_date: string, str_time: string) {
            var split_date = str_date.split('-');
            var split_time = str_time.split(':');
            return new Date(
                parseInt(split_date[0], 10),
                parseInt(split_date[1], 10) - 1,
                parseInt(split_date[2], 10),
                parseInt(split_time[0], 10),
                parseInt(split_time[1], 10));
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
        } else {
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
    }, function(errLine) {
        console.log(errLine);
    }, function(err) {
        aCb(err, file_info_list);
    });
}

export function pm_list_features(aCb: (err: any, feature_list: string[]) => void) {
    var re = /feature:(.*)/;
    var result: string[] = [];
    serial_commander.run_command('pm list features', function(line) {
        var match = re.exec(line);
        if (match) {
            result.push(match[1]);
        }
    }, function(errLine) {
        console.error(errLine);
    }, function(exitCode) {
        aCb(exitCode, result);
    });
}

export interface TPackageInfo {
    apk_path: string;
    package_name: string;
}

export function pm_list_packages(aCb: (err: any, result: TPackageInfo[]) => void) {
    var re = /package:(.*)=(.*)/;
    var result: TPackageInfo[] = [];
    serial_commander.run_command('pm list packages', function(line) {
        var match = re.exec(line);
        if (match) {
            result.push({
                apk_path: match[1],
                package_name: match[2]
            });
        }
    }, function(errLine) {
        console.error(errLine);
    }, function(exitCode) {
        aCb(exitCode, result);
    });
}

interface TInstrumentationInfo {
    package_name: string;
    runner: string;
    target: string;
}

export function pm_list_instrumentation(aCb: (err: any, instrumentation_info_list: TInstrumentationInfo[]) => void) {
    var re = /instrumentation:(.*)\/(.*) \(target=(.*)/;
    var result: TInstrumentationInfo[] = [];
    serial_commander.run_command('pm list instrumentation', function(line) {
        var match = re.exec(line);
        if (match) {
            result.push({
                package_name: match[1],
                runner: match[2],
                target: match[3]
            });
        }
    }, function(errLine) {
        console.log(errLine);
    }, function(exitCode) {
        aCb(exitCode, result);
    });
}

export function install_apk(aPath: string, aCb: (err: any) => void) {
    serial_commander.run_command('pm install ' + aPath, function(line) {
    }, function(errLine) {
        console.log(errLine);
    }, function(exitCode) {
        aCb(exitCode);
    });
}

export function run_test(aPackageName: string, aRunner: string, aCb: (err: any) => void) {
    serial_commander.run_command('am instrument -r -w ' + aPackageName + '/' + aRunner, function(line) {
        console.log(line);
    }, function(errLine) {
        console.log(errLine);
    }, function(exitCode) {
        aCb(exitCode);
    });
}

export function template(aPath: string, aCb: (err: any) => void) {
    serial_commander.run_command('ll ' + aPath, function(line) {
        console.log(line);
    }, function(errLine) {
        console.log(errLine);
    }, function(exitCode) {
        console.log('finished: ', exitCode);
        aCb(exitCode);
    });
}
