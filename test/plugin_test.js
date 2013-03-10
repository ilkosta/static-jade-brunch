var path = require("path");

describe('Plugin', function() {
  var startingDir = process.cwd();
  var jbPresentDir = path.join(startingDir, 'test/jade-brunch/present');
  var defAsset = "app/assets";

  before(function(){ process.chdir(jbPresentDir); });

  it('should be an object', function() {
    var plugin = new Plugin({});
    expect(plugin).to.be.ok;
  });

  it('should has #onCompile method', function() {
    var plugin = new Plugin({});
    expect(plugin.onCompile).to.be.an.instanceof(Function);
  });

  describe("The `isFileToCompile` method", function() {
    it("should manage each .jade file by default", function() {
      var plugin = new Plugin({});
      expect(plugin.isFileToCompile("app/foo.jade")).to.be.ok;
    });
    it("should manage the file with the extension specified by config", function() {
      var plugin = new Plugin({
        plugins: {
          static_jade: {
            extension: ".static.jade"
            }
        }
      });

      expect(plugin.isFileToCompile("app/foo.jade")).to.not.be.ok;
      expect(plugin.isFileToCompile("app/foo.static.jade")).to.be.ok;
    });
    it("should manage the file within the directories specified" +
      " by the regexp in plugins.static_jade.path", function() {
      var plugin = new Plugin({
        plugins: {
          static_jade: {
            path: [/app(\/|\\)foo/, /app(\/|\\)bar/]
          }
        }
      });
      expect(plugin.isFileToCompile("app/index.jade"  )).to.not.be.ok;
      expect(plugin.isFileToCompile("app/foo.jade"    )).to.not.be.ok;
      expect(plugin.isFileToCompile("app/foo/foo.jade")).to.be.ok;
      expect(plugin.isFileToCompile("app/bar/foo.jade")).to.be.ok;
    });
  });

  describe("The `getHtmlFilePath` method", function() {
    describe("create output in the `config.conventions.assets` directory", function(){
      it("should get .html from .jade in the 'assets' dir by default", function() {
        var plugin = new Plugin({});
        expect(plugin.getHtmlFilePath("app/foo.jade",defAsset)).to.equal("app/assets/foo.html");
        expect(plugin.getHtmlFilePath("app/foo.static.jade",defAsset)).to.not.equal("app/assets/foo.html");
      });
      it("should get .html from .jade in the configured assets directory", function() {
        var asset = "app/fake_asset";
        var plugin = new Plugin({
          plugins: {
            static_jade: {
              asset: asset
            }
          }
        });
        expect(plugin.getHtmlFilePath("app/foo.jade", asset)).to.equal("app/fake_asset/foo.html");
        expect(plugin.getHtmlFilePath("app/foo.static.jade", asset)).to.not.equal("app/assets/foo.html");
      });
    });
    it("should get .html from .jade file by default", function() {
      var plugin = new Plugin({});
      expect(plugin.getHtmlFilePath("app/foo.jade",defAsset)).to.equal("app/assets/foo.html");
      expect(plugin.getHtmlFilePath("app/foo.static.jade",defAsset)).to.not.equal("app/assets/foo.html");
    });
    it("should get .html based on the extension specified in config.coffee", function() {
      var plugin = new Plugin({
        plugins: {
          static_jade: {
            extension: ".static.jade"
          }
        }
      });
      expect(plugin.getHtmlFilePath("app/foo.jade",defAsset)).to.not.equal("app/assets/foo.html");
      expect(plugin.getHtmlFilePath("app/foo.static.jade",defAsset)).to.equal("app/assets/foo.html");
    });
  });
  describe("the configuration of the jade compiler", function(){
    var jade = require('jade');

    describe('must be backward compatible', function(){
      it('must manage the options inside config.plugins.jade.options', function(){
        var config = {
              plugins: {
                jade: {
                  options: { pretty: true }
                }
              }
            }
          , plugin = new Plugin(config);
        expect(plugin.options.pretty).to.be.equal(
            config.plugins.jade.options.pretty);
      });
      it('must manage the locals inside config.plugins.jade.locals', function(){
        var config = {
              plugins: {
                jade: {
                  locals: { foo: 'bar' }
                }
              }
            }
          , plugin = new Plugin(config);
        expect(plugin.locals.foo).to.be.equal(config.plugins.jade.locals.foo);
      });
      it('must manage the options inside config.plugins.jade too, as backward', function(){
        var config = {
              plugins: {
                jade: {
                  pretty: true
                }
              }
            }
          , plugin = new Plugin(config);
        expect(plugin.options.pretty).to.be.equal(config.plugins.jade.pretty);
      });
    });
    describe("all the compilation options must work", function() {
      var fs = require('fs')
        , testdir = 'compilation_test'
        ;

      function deleteFile(path,done) {
        fs.exists(path, function(exists) {
          if(exists)
            fs.unlink(path, function(err) {
              if(err) done(err);
            });
        });
      }

      function cleanTestDir(done) {
        fs.readdir(testdir, function(err,files) {
          if(err) done(err);
          else {
            files.forEach(function(file) {
              deleteFile(path.join(testdir,file), done);
            });
            done();
          }
        });
      }

      before( function(done) {
        fs.exists(testdir, function(exists) {
          if(exists)
            cleanTestDir(done);
          else
            fs.mkdir(testdir, done);
        });
      });

      after( function(done) {
        cleanTestDir(done);
      });

      it('should support .compile()', function(done){
        var fname = 'compile.jade'
          , fpath = path.join(testdir, fname)
          , content = 'p foo\n.test\np bar'
          , config = {}
          , plugin = new Plugin(config);

        fs.writeFile(fpath, content, function(err) {
          if(err) done(err);

          plugin.fromJade2Html(fpath,function(err, result) {
            if(err) done(err);
            else {
              var fn = jade.compile(content);
              expect(result).to.equal(fn());
              done();
            }
          });
        });
      });

      it('should support .compile() locals', function(done){
//         var fn = jade.compile('p= foo');
//         assert.equal('<p>bar</p>', fn({ foo: 'bar' }));
        var fname = 'compile_locals.jade'
          , fpath = path.join(testdir, fname)
          , content = 'p= foo'
          , config = {
              plugins: {
                jade: {
                  locals: { foo: 'bar' }
                }
              }
            }
          , plugin = new Plugin(config);

        fs.writeFile(fpath, content, function(err) {
          if(err) done(err);
          else {
            plugin.fromJade2Html(fpath,function(err, result) {
              if(err) done(err);
              else {
                var fn = jade.compile(content);
                expect(result).to.equal(fn(config.plugins.jade.locals));
                done();
              }
            });
          }
        });
      });

      it('should support .compile() no debug', function(done){
//         var fn = jade.compile('p foo\np #{bar}', {compileDebug: false});
//         assert.equal('<p>foo</p><p>baz</p>', fn({bar: 'baz'}));
        var fname = 'compile_no_debug.jade'
          , fpath = path.join(testdir, fname)
          , content = 'p foo\np #{bar}'
          , config = {
              plugins: {
                jade: {
                  options: {compileDebug: false},
                  locals: { bar: 'baz' }
                }
              }
            }
          , plugin = new Plugin(config);

        fs.writeFile(fpath, content, function(err) {
          if(err) done(err);
          else {
            plugin.fromJade2Html(fpath,function(err, result) {
              if(err) done(err);
              else {
                var fn = jade.compile(content, config.plugins.jade.options);
                expect(result).to.equal(fn(config.plugins.jade.locals));
                done();
              }
            });
          }
        });
      });

      it('should support .compile() no debug and global helpers', function(done){
//         var fn = jade.compile('p foo\np #{bar}', {compileDebug: false, helpers: 'global'});
//         assert.equal('<p>foo</p><p>baz</p>', fn({bar: 'baz'}));
        var fname = 'compile_no_debug_global_helpers.jade'
          , fpath = path.join(testdir, fname)
          , content = 'p foo\np #{bar}'
          , config = {
              plugins: {
                jade: {
                  options: {compileDebug: false, helpers: 'global'},
                  locals: { bar: 'baz' }
                }
              }
            }
          , plugin = new Plugin(config);

        fs.writeFile(fpath, content, function(err) {
          if(err) done(err);
          else {
            plugin.fromJade2Html(fpath,function(err, result) {
              if(err) done(err);
              else {
                var fn = jade.compile(content, config.plugins.jade.options);
                expect(result).to.equal(fn(config.plugins.jade.locals));
                done();
              }
            });
          }
        });

      });
    });
  });

  it('do not outputs tokens and function body generated by default', function(){

  });
}
);
