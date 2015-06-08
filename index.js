/// <reference path='typings/tsd.d.ts' />
var fs = require('fs');
var serial_commander = require('serial_commander');
var libxmljs = require('libxmljs');
function init(cb) {
    serial_commander.init('/dev/ttyS0', function () {
        cb();
    });
}
exports.init = init;
function debug_run_command(aCommand, aCb) {
    console.log('debug_run_command: ' + aCommand);
    serial_commander.run_command(aCommand, function (line) {
        console.log('O: ' + line);
    }, function (errLine) {
        console.log('E: ' + errLine);
    }, function (exitCode) {
        console.log('F: ' + exitCode);
        aCb(exitCode);
    });
}
exports.debug_run_command = debug_run_command;
/**
 *
 * @param aPath
 * @param aCb
 */
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
    }, function (errLine) {
        console.log(errLine);
    }, function (err) {
        aCb(err, file_info_list);
    });
}
exports.list = list;
function pm_list_features(aCb) {
    var re = /feature:(.*)/;
    var result = [];
    serial_commander.run_command('pm list features', function (line) {
        var match = re.exec(line);
        if (match) {
            result.push(match[1]);
        }
    }, function (errLine) {
        console.error(errLine);
    }, function (exitCode) {
        aCb(exitCode, result);
    });
}
exports.pm_list_features = pm_list_features;
function pm_list_packages(aCb) {
    var re = /package:(.*)=(.*)/;
    var result = [];
    serial_commander.run_command('pm list packages', function (line) {
        var match = re.exec(line);
        if (match) {
            result.push({
                apk_path: match[1],
                package_name: match[2]
            });
        }
    }, function (errLine) {
        console.error(errLine);
    }, function (exitCode) {
        aCb(exitCode, result);
    });
}
exports.pm_list_packages = pm_list_packages;
function pm_list_instrumentation(aCb) {
    var re = /instrumentation:(.*)\/(.*) \(target=(.*)/;
    var result = [];
    serial_commander.run_command('pm list instrumentation', function (line) {
        var match = re.exec(line);
        if (match) {
            result.push({
                package_name: match[1],
                runner: match[2],
                target: match[3]
            });
        }
    }, function (errLine) {
        console.log(errLine);
    }, function (exitCode) {
        aCb(exitCode, result);
    });
}
exports.pm_list_instrumentation = pm_list_instrumentation;
function install_apk(aPath, aCb) {
    serial_commander.run_command('pm install ' + aPath, function (line) {
    }, function (errLine) {
        console.log(errLine);
    }, function (exitCode) {
        aCb(exitCode);
    });
}
exports.install_apk = install_apk;
(function (TTestType) {
    TTestType[TTestType["ENone"] = 3] = "ENone";
    TTestType[TTestType["EStarted"] = 1] = "EStarted";
    TTestType[TTestType["EPass"] = 0] = "EPass";
    TTestType[TTestType["EFail"] = -1] = "EFail";
    TTestType[TTestType["EError"] = -2] = "EError";
})(exports.TTestType || (exports.TTestType = {}));
var TTestType = exports.TTestType;
// ref: http://comments.gmane.org/gmane.comp.handhelds.android.devel/116034
function run_test(aPackageName, aRunner, aEventCb, aCb) {
    var re_status = /INSTRUMENTATION_STATUS: (.*)=(.*)/;
    var parser_map = {
        'numtests': function (str) {
            return parseInt(str, 10);
        },
        'current': function (str) {
            return parseInt(str, 10);
        }
    };
    var re_code = /INSTRUMENTATION_STATUS_CODE: (.*)/;
    var event = {};
    var doc = new libxmljs.Document(1, 'utf-8');
    var elTestSuit = doc.node('testsuits', null).node('testsuite', null);
    // ref: http://zutubi.com/source/projects/android-junit-report/documentation/
    // am instrument -e reportFile my-report.xml -r -w
    var time_start = (new Date()).getTime();
    var cnt_total = 0;
    var cnt_errors = 0;
    var cnt_failures = 0;
    var cnt_skipped = 0;
    var time_case_start;
    // am instrument -e log true -e package com.lookout -e notAnnotation com.lookout.annotations.ExcludeFromDefault -r -w com.android.cts.bluetooth/android.test.InstrumentationCtsTestRunner
    // nohup logcat &
    serial_commander.run_command('am instrument -r -w ' + aPackageName + '/' + aRunner, function (line) {
        //console.log(line);
        var code_handlers = {};
        code_handlers[3 /* ENone */] = function () {
        };
        code_handlers[1 /* EStarted */] = function () {
            cnt_total++;
            time_case_start = (new Date()).getTime();
        };
        code_handlers[0 /* EPass */] = function () {
        };
        code_handlers[-1 /* EFail */] = function () {
            cnt_failures++;
        };
        code_handlers[-2 /* EError */] = function () {
            cnt_errors++;
        };
        var match_status = re_status.exec(line);
        if (match_status) {
            var key = match_status[1];
            var value = match_status[2];
            event[key] = parser_map[key] ? parser_map[key](value) : value;
        }
        else {
            var match_code = re_code.exec(line);
            if (match_code) {
                var code = parseInt(match_code[1], 10);
                event['type'] = code;
                aEventCb(event);
                code_handlers[code]();
                if (code !== 1) {
                    var elTestCase = elTestSuit.node('testcase');
                    elTestCase.attr({
                        'classname': event['class'],
                        'name': event['test'],
                        'time': (((new Date()).getTime() - time_case_start) / 1000).toString()
                    });
                }
                event = {};
            }
        }
    }, function (errLine) {
        console.log('ERR: ' + errLine);
    }, function (exitCode) {
        var time_div = (new Date()).getTime() - time_start;
        elTestSuit.attr({
            'name': aPackageName,
            'errors': '' + cnt_errors,
            'failures': '' + cnt_failures,
            'skipped': '' + cnt_skipped,
            'tests': '' + cnt_total,
            'time': (time_div / 1000).toString()
        });
        aCb(exitCode, doc);
    });
}
exports.run_test = run_test;
function get_file(aPathSource, aPathTarget, aCb) {
    var base64string = '';
    serial_commander.run_command('cat ' + aPathSource + ' | base64', function (line) {
        base64string += line;
    }, function (errLine) {
        console.error(errLine);
    }, function (exitCode) {
        var buf = new Buffer(base64string, 'base64');
        fs.writeFile(aPathTarget, buf, function (err) {
            aCb(err);
        });
    });
}
exports.get_file = get_file;
function template(aPath, aCb) {
    serial_commander.run_command('ll ' + aPath, function (line) {
        console.log(line);
    }, function (errLine) {
        console.error(errLine);
    }, function (exitCode) {
        console.log('finished: ', exitCode);
        aCb(exitCode);
    });
}
exports.template = template;
//# sourceMappingURL=index.js.map