var child_process = require('child_process'), exec = child_process.exec, spawn = child_process.spawn;
var sysPath = require('path');
var fs = require('fs');

var mode = process.argv[2];

var fsExists = fs.exists || sysPath.exists;

var execute = function(pathParts, params, callback) {
  if (callback == null) callback = function() {};
  var path = sysPath.join.apply(null, pathParts);
  var command = 'node ' + path + ' ' + params;
  console.log('Executing', command);
  exec(command, function(error, stdout, stderr) {
    if (error != null) return process.stderr.write(stderr.toString());
    console.log(stdout.toString());
  });
};

if (mode === 'prepublish') {
  var coffee = __dirname + '/node_modules/coffee-script/bin/coffee';
  spawn('node', [coffee, '-o', 'lib', '-c', 'src'], {
    cwd: __dirname,
    stdio: 'inherit'
  });
} else if (mode === 'postinstall') {
  fsExists(sysPath.join(__dirname, 'lib'), function(exists) {
    if (exists) return;
    execute(['node_modules', 'coffee-script', 'bin', 'coffee'], '-o lib/ src/');
  });
} else if (mode === 'test') {
  execute(['node_modules', 'mocha', 'bin', 'mocha'],
    '--require test/common.js --colors --ignore-leaks');
}
