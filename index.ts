
/// <reference path='typings/tsd.d.ts' />

import fs = require('fs');
import path = require('path')

import libxmljs = require('libxmljs');
import async = require('async');

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

        var base_dir = path.dirname(aPath);

        var is_dir: boolean;
        var filename: string;
        var base_path: string;
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
                base_path = base_dir;
                full_path = base_path + '/' + filename;
                size = 0;
                time = to_time(match[4], match[5]);
            }
        } else {
            var match = re_file.exec(line);
            if (match) {
                is_dir = false;
                filename = match[7];
                base_path = base_dir;
                full_path = base_path + '/' + filename;
                size = parseInt(match[4]);
                time = to_time(match[5], match[6]);
            }
        }

        if (filename) {
            file_info_list.push({
                is_dir: is_dir,
                filename: filename,
                path: base_path,
                full_path: full_path,
                size: size,
                time: time
            });
        }
    }, function(errLine) {
        console.error(errLine);
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
        console.error(errLine);
    }, function(exitCode) {
        aCb(exitCode, result);
    });
}

export function install_apk(aPath: string, aCb: (err: any) => void) {
    serial_commander.run_command('pm install ' + aPath, function(line) {
    }, function(errLine) {
        console.error(errLine);
    }, function(exitCode) {
        aCb(exitCode);
    });
}

export enum TTestType {
    ENone = 3,
    EStarted = 1,
    EPass = 0,
    EFail = -1,
    EError = -2
}

export interface TTestEvent {
    type: TTestType;
    id: string;
    clazz: string;
    stream: string;
    test: string;
    current: number;
    numtests: number;
}

// ref: http://comments.gmane.org/gmane.comp.handhelds.android.devel/116034
export function run_test(aPackageName: string, aRunner: string, aGetLogCatLog: boolean, aEventCb: (event: TTestEvent) => void, aCb: (err: any, junit_xml: libxmljs.XMLDocument) => void) {

    var series = [];

    var doc = new libxmljs.Document();
    var logcat_file_name = 'logcat.' + aPackageName + '.txt';
    var logcat_path = '/sdcard/' + logcat_file_name;

    series.push(function(done) {
        serial_commander.run_command('logcat -c', function() {

        }, function(errLine) {
            console.error(errLine);
        }, function(exitCode) {
            done(exitCode);
        });
    });

    series.push(function(done) {
        var re_status = /INSTRUMENTATION_STATUS: (.*)=(.*)/;
        var parser_map = {
            'numtests': function(str: string) {
                return parseInt(str, 10);
            },
            'current': function(str: string) {
                return parseInt(str, 10);
            }
        };
        var re_code = /INSTRUMENTATION_STATUS_CODE: (.*)/;

        var event: any = {};

        var elTestSuit = doc.node('testsuites', null).node('testsuite', null);

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

        serial_commander.run_command('am instrument -r -w ' + aPackageName + '/' + aRunner, function(line) {

            //console.log(line);

            var el;

            var code_handlers = {};
            code_handlers[TTestType.ENone] = function() {

            };
            code_handlers[TTestType.EStarted] = function() {
                cnt_total++;
                time_case_start = (new Date()).getTime();
            };
            code_handlers[TTestType.EPass] = function() {
            };
            code_handlers[TTestType.EFail] = function() {
                el = new libxmljs.Element(doc, 'failure');
                cnt_failures++;
            };
            code_handlers[TTestType.EError] = function() {
                el = new libxmljs.Element(doc, 'error');
                cnt_errors++;
            };

            var match_status = re_status.exec(line);
            if (match_status) {
                var key = match_status[1];
                var value = match_status[2];
                event[key] = parser_map[key] ? parser_map[key](value) : value;
            } else {
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
                        if (el) {
                            elTestCase.addChild(el);
                        }
                    }
                    event = {};
                }
            }

        }, function(errLine) {
            console.error('ERR: ' + errLine);
        }, function(exitCode) {
            var time_div = (new Date()).getTime() - time_start;
            elTestSuit.attr({
                'name': aPackageName,
                'errors': '' + cnt_errors,
                'failures': '' + cnt_failures,
                'skipped': '' + cnt_skipped,
                'tests': '' + cnt_total,
                'time': (time_div / 1000).toString()
            });
            done(exitCode);
        });
    });

    if (aGetLogCatLog) {
        series.push(function(done) {
            // ref: http://www.dreamy.pe.kr/zbxe/CodeClip/142826
            serial_commander.run_command('logcat -d -f ' + logcat_path, function() {

            }, function(errLine) {
                console.error(errLine);
            }, function(exitCode) {
                done(exitCode);
            });
        });

        series.push(function(done) {
            get_file(logcat_path, logcat_file_name, function(err) {
                done(err);
            });
        });
    }

    async.series(series, function(err) {
        aCb(err, doc);
    });
}

export function get_file(aPathSource: string, aPathTarget: string, aCb: (err: any) => void) {

    var base64string = '';
    serial_commander.run_command('cat ' + aPathSource + ' | base64', function(line) {
        base64string += line;
    }, function(errLine) {
        console.error(errLine);
    }, function(exitCode) {
        var buf = new Buffer(base64string, 'base64');
        fs.writeFile(aPathTarget, buf, function(err) {
            aCb(err);
        });
    });
}

export function get_files(aPathSourceList: string[], aPathTarget: string, aCb: (err: any, file_list: string[]) => void) {
    var s = [];
    var i, len = aPathSourceList.length, source, target;
    var target_list = [];
    for (i=0; i<len; i++) {
        source = aPathSourceList[i];
        target = aPathTarget + '/' + path.basename(source);
        if (!fs.existsSync(target)) {
            s.push(function(source, target) {
                return function(done) {
                    get_file(source, target, done);
                }
            }(source, target));
        }
        target_list.push(target);
    }

    async.series(s, function(err) {
        if (err) {
            aCb(err, null);
        } else {
            aCb(err, target_list)
        }
    });
}

export function template(aPath: string, aCb: (err: any) => void) {
    serial_commander.run_command('ll ' + aPath, function(line) {
        console.log(line);
    }, function(errLine) {
        console.error(errLine);
    }, function(exitCode) {
        console.log('finished: ', exitCode);
        aCb(exitCode);
    });
}

export interface TTestCaseInfo {
    name: string;
    appNameSpace: string;
    appPackageName: string;
    runner: string;
}

export function install_and_run(aTestCasePkgDir: string, aTestCases: TTestCaseInfo[],
                         aCbEvent: (no: number, max: number, evt: TTestEvent) => void,
                         aCb: (err: any, junit_xml: libxmljs.XMLDocument) => void) {

    var series = [];
    var max = aTestCases.length;

    series.push(function(done) {
        install_apk(aTestCasePkgDir + '/CtsTestStubs.apk', done);
    });

    aTestCases.forEach(function(info) {
        series.push((function(info) {
            return function(done) {
                install_apk(aTestCasePkgDir + '/' + info.name + '.apk', done)
            };
        })(info));
    });

    var docs = [];
    aTestCases.forEach(function(info, i) {
        series.push((function(info, i) {
            return function(done) {
                run_test(info.appNameSpace, info.runner, false, function(event) {
                    aCbEvent(i, max, event);
                }, function(err, result) {
                    docs.push(result);
                    //console.log(result.toString());
                    done(err);
                });
            };
        })(info, i));
    });

    async.series(series, function(err) {
        var doc = new libxmljs.Document();
        var elTestSuites = doc.node('testsuites', null);
        docs.forEach(function(d) {
            //console.log(d.toString());
            var testsuit = d.get('/testsuites/testsuite');
            if (testsuit) {
                elTestSuites.addChild(testsuit);
            }
        });
        aCb(err, doc);
    });
}

export function run_test_plan(aPath: string,
                              aCbEvent: (no: number, max: number, evt: TTestEvent) => void,
                              aCb: (err: any, junit_xml: libxmljs.XMLDocument) => void) {

    var series = [];
    var target_path = 'temp';
    var dir_test_cases = path.dirname(aPath) + '/../test_cases';

    if (!fs.existsSync(target_path)) {
        fs.mkdirSync(target_path);
    }

    var local_test_plan_xml = target_path + '/' + path.basename(aPath);
    //console.log(local_test_plan_xml);
    if (!fs.existsSync(local_test_plan_xml)) {
        series.push(function(done) {
            get_file(aPath, local_test_plan_xml, done);
        });
    }

    var test_case_xml_list = [];
    series.push(function(done) {
        var dir = dir_test_cases + '/*.xml';
        list(dir, function(err, file_list) {
            file_list.forEach(function(info) {
                test_case_xml_list.push(info.full_path);
            });
            done(err);
        });
    });

    var local_test_case_xml_list;
    series.push(function(done) {
        get_files(test_case_xml_list, target_path, function(err, file_list) {
            local_test_case_xml_list = file_list;
            done(err);
        });
    });

    var test_cases_to_run: TTestCaseInfo[] = [];
    series.push(function(done) {
        var test_case_info_map = {};
        local_test_case_xml_list.forEach(function(f) {
            try {
                var doc = libxmljs.parseXmlString(fs.readFileSync(f).toString());
                var elTestPackage = doc.get('/TestPackage');
                var atName = elTestPackage.attr('name');
                var atAppNameSpace = elTestPackage.attr('appNameSpace');
                var atAppPackageName = elTestPackage.attr('appPackageName');
                var atRunner = elTestPackage.attr('runner');
                if (atName && atAppNameSpace && atAppPackageName && atRunner) {
                    test_case_info_map[atAppPackageName.value()] = {
                        name: atName.value(),
                        appNameSpace: atAppNameSpace.value(),
                        appPackageName: atAppPackageName.value(),
                        runner: atRunner.value()
                    };
                } else {
                    console.error(f, 'invalid format');
                }
            } catch(e) {
                console.error(f, 'parsing error');
                console.error(e);
            }
        });

        var plan = libxmljs.parseXmlString(fs.readFileSync(local_test_plan_xml).toString());
        var entries = plan.find('/TestPlan/Entry');
        entries.forEach(function(el) {
            var atUri = el.attr('uri');
            if (atUri) {
                var info = test_case_info_map[atUri.value()];
                if (info) {
                    test_cases_to_run.push(info);
                } else {
                    console.error(atUri.value(), 'not found!');
                }
            }
        });
        done();
    });

    var result;
    series.push(function(done) {
        install_and_run(dir_test_cases, test_cases_to_run, function(no, max, event){
            aCbEvent(no, max, event);
        }, function(err, r) {
            result = r;
            done();
        });
    });

    async.series(series, function(err) {
        aCb(err, result);
    });

}


export function load_test_case_info(aTestPlanPath: string, aTestCaseDir: string, aCb: (err, info_list: TTestCaseInfo[]) => void) {

    var series = [];

    var test_case_xml_list;
    series.push(function(done) {
        fs.readdir(aTestCaseDir, function(err, files) {
            test_case_xml_list = files;
            done(err);
        });
    });

    var test_cases_to_run: TTestCaseInfo[] = [];
    series.push(function(done) {
        var test_case_info_map = {};
        test_case_xml_list.forEach(function(f) {
            f = aTestCaseDir + '/' + f;
            try {
                var doc = libxmljs.parseXmlString(fs.readFileSync(f).toString());
                var elTestPackage = doc.get('/TestPackage');
                var atName = elTestPackage.attr('name');
                var atAppNameSpace = elTestPackage.attr('appNameSpace');
                var atAppPackageName = elTestPackage.attr('appPackageName');
                var atRunner = elTestPackage.attr('runner');

                if (!atName) {
                    console.error(f, 'name attribute missing');
                } else if (!atAppNameSpace) {
                    console.error(f, 'appNameSpace attribute missing');
                } else if (!atAppPackageName) {
                    console.error(f, 'appPackageName attribute missing');
                } else if (!atRunner) {
                    console.error(f, 'runner attribute missing');
                } else {
                    test_case_info_map[atAppPackageName.value()] = {
                        name: atName.value(),
                        appNameSpace: atAppNameSpace.value(),
                        appPackageName: atAppPackageName.value(),
                        runner: atRunner.value()
                    };
                }
            } catch(e) {
                console.error(f, 'parsing error');
                console.error(e);
            }
        });

        var plan = libxmljs.parseXmlString(fs.readFileSync(aTestPlanPath).toString());
        var entries = plan.find('/TestPlan/Entry');
        entries.forEach(function(el) {
            var atUri = el.attr('uri');
            if (atUri) {
                var info = test_case_info_map[atUri.value()];
                if (info) {
                    test_cases_to_run.push(info);
                } else {
                    console.error(atUri.value(), 'not found!');
                }
            }
        });
        done();
    });

    async.series(series, function(err) {
        aCb(err, test_cases_to_run);
    });

}