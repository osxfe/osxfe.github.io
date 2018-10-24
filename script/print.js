/**
 * Created by dubaoxing on 2017/3/29.
 */
var Print = {};
var chalk = require('chalk');
var Show = console.log;

Print.warning = function (text) {
    Show('\n');
    Show(chalk.bgYellow(' WARNING: ') + ' ' + text);
};

Print.error = function (text) {
    Show('\n');
    Show(chalk.bgRed(' ERROR: ') + ' ' + text);
    process.exit();
};

Print.info = function (text) {
    Show('\n');
    Show(chalk.bgWhite(' INFO: ') + ' ' + text);
};

Print.success = function (text) {
    Show('\n');
    Show(chalk.bgGreen(' SUCCESS: ') + ' ' + text);
};

module.exports = Print;
