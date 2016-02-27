'use strict';

const jade = require('jade');
const sysPath = require('path');
const mkdirp = require('mkdirp');
const fs = require('fs');
const color = require('ansi-color').set;
const growl = require('growl');
const util = require('util');

const logError = (err, title) => {
  if (!title) title = 'Brunch jade error';
  if (err) {
    console.log(color(err, "red"));
    return growl(err, { title: title });
  }
};

const fileWriter = newFilePath => {
  return (err, content) => {
    if (err) throw err;
    if (!content) return;
    const dirname = sysPath.dirname(newFilePath);
    return mkdirp(dirname, '0775', err => {
      if (err) throw err;
      return fs.writeFile(newFilePath, content, err => {
        if (err) throw err;
      });
    });
  };
};

const isArray = obj => !!(obj && obj.concat && obj.unshift && !obj.callee);


class StaticJadeCompiler {
  constructor(config) {
    this.config = config;
    const jadeConf = config.plugins && config.plugins.jade;
    const stJadeConf = config.plugins && config.plugins.static_jade || {};
    this.locals = jadeConf && jadeConf.locals || () => {};
    this.extension = stJadeConf.extension || '.jade';
    this.relAssetPath = stJadeConf.asset || 'app/assets';
    this.rootPath = stJadeConf.rootPath || 'app';

    const options = jadeConf && jadeConf.options || jadeConf;
    this.options = Object.assign({}, options);

    mkdirp.sync(this.relAssetPath);
  }

  isFileToCompile(filePath) {
    const conf = this.config.plugins && this.config.plugins.static_jade;
    const path = conf && conf.path;
    if (path && isArray(path)) {
      const fileDir = sysPath.dirname(filePath);
      const positivePaths = path.filter(p => p.test(fileDir));
      if (positivePaths.length === 0) return false;
    }

    const fileName = sysPath.basename(filePath);
    return fileName.slice(-this.extension.length) === this.extension;
  }

  getHtmlFilePath(jadeFilePath, relAssetPath) {
    const relativeFilePathParts = sysPath.normalize(jadeFilePath).split(sysPath.sep);
    relativeFilePathParts.push(relativeFilePathParts.pop().slice(0, -this.extension.length) + ".html");
    const rootFilePathParts = sysPath.normalize(this.rootPath).split(sysPath.sep);
    const pathStartIdx = rootFilePathParts.length;
    const relativeFilePath = sysPath.join.apply(this, relativeFilePathParts.slice(pathStartIdx));
    const newpath = sysPath.join(relAssetPath, relativeFilePath);
    return newpath;
  }

  fromJade2Html(jadeFilePath, callback) {
    const options = this.options;
    const locals = Object.assign({}, this.locals);
    try {
      return fs.readFile(jadeFilePath, (err, data) => {
        if (err) throw err;

        this.options.filename = jadeFilePath;
        this.options.basedir = sysPath.join('.', 'app');
        locals.filename = jadeFilePath.replace(new RegExp('^' + this.options.basedir + '/'), '');
        const fn = jade.compile(data, this.options);
        return callback(err, fn(locals));
      });
    } catch (error) {
      return callback(error);
    }
  }

  onCompile(changedFiles) {
    changedFiles.forEach(file => {
      const filesToCompile = file.sourceFiles.map(f => f.path).filter(p => this.isFileToCompile(p));

      filesToCompile.forEach(jadeFileName => {
        const newFilePath = this.getHtmlFilePath(jadeFileName, this.relAssetPath);

        try {
          this.fromJade2Html(jadeFileName, fileWriter(newFilePath));
        } catch (err) {
          logError(err);
        }
      });
    });
  }
}

StaticJadeCompiler.prototype.brunchPlugin = true;
StaticJadeCompiler.prototype.type = 'template';
StaticJadeCompiler.prototype.extension = ".jade";

module.exports = StaticJadeCompiler;
