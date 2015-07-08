/// <reference path='typings/tsd.d.ts' />
var async = require('async');
var api = require('./index');
async.series([
    function (done) {
        console.log('TEST: init');
        api.init('/dev/ttyS0', function () {
            api.set_show_log(true);
            api.wait_line(/\s*(\w+)\(\s*(\d+)\);E;/, function (match) {
                console.log(match[1], match[2]);
            });
            done(null, null);
        });
    },
    function (done) {
        console.log('TEST: list');
        api.debug_run_command('ls', function (err) {
            done(err, null);
        });
    },
    function (done) {
        api.wait_line_once(/Configuring eth0 interface/, function () {
            console.log('WAIT LINE PASS');
            done(null, null);
        });
    },
    //function(done) {
    //    console.log('TEST: list');
    //    api.list('/storage/external_storage/sda1/test_plans', function(err, list) {
    //        console.log(list);
    //        done(err, null);
    //    });
    //},
    //function(done) {
    //    console.log('TEST: list');
    //    api.get_file(
    //        '/storage/external_storage/sda1/test_cases/CtsMediaTestCases.xml',
    //        'CtsMediaTestCases.xml',
    //        function(err) {
    //            done(err, null);
    //        }
    //    );
    //},
    //function(done) {
    //    console.log('TEST: list features');
    //    api.pm_list_features(function(err, feature_list) {
    //        console.log(feature_list);
    //        done(err, null);
    //    });
    //},
    //function(done) {
    //    console.log('TEST: list packages');
    //    api.pm_list_packages(function(err, package_info_list) {
    //        console.log(package_info_list);
    //        done(null, null);
    //    });
    //},
    //function(done) {
    //    console.log('TEST: list instrumentation');
    //    api.pm_list_instrumentation(function(err, instrumentation_info_list) {
    //        console.log(instrumentation_info_list);
    //        done(null, null);
    //    });
    //},
    //function(done) {
    //    console.log('TEST: install');
    //    api.install_apk('/storage/external_storage/sda1/test_cases/CtsBluetoothTestCases.apk', function(err) {
    //        console.log('TEST: install result: ' + err);
    //        done(null, null);
    //    });
    //},
    //function(done) {
    //    console.log('TEST: run test');
    //    api.run_test('com.android.cts.bluetooth', 'android.test.InstrumentationCtsTestRunner',
    //        function(event) {
    //            console.log(event);
    //        },
    //        function(err, doc) {
    //            console.log('RESULT: ' + err);
    //            console.log(doc.toString());
    //            done(null, null);
    //        }
    //    );
    //},
    //function(done) {
    //    console.log('TEST: run test plan');
    //    api.run_test_plan('/storage/external_storage/sda1/test_plans/CTS-min.xml', function(no, max, event){
    //        console.log('TEST: ', no, max, event);
    //    }, function(err, xml) {
    //        fs.writeFileSync('test_result.xml', xml.toString());
    //        done(err, null);
    //    });
    //}
    function (done) {
        console.log('TEST: run test plan');
        api.load_test_case_info('CTS-min.xml', 'temp', function (err, list) {
            console.log(err);
            console.log(list);
            done(err, null);
        });
    }
], function (err) {
    if (err) {
        console.log('err: ' + err);
    }
    //process.exit();
});
//# sourceMappingURL=test.js.map