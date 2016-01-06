var chai = require('chai');

global.expect = chai.expect;
global.Plugin = require('../lib');

var chaiFilesystemPaths = require('./helpers/filesystem_paths');
chai.use(chaiFilesystemPaths);
