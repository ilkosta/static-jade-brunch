var path = require("path");

describe('Plugin', function() {
  var startingDir = process.cwd();
  var jbPresentDir = path.join(startingDir, 'test/jade-brunch/present');
  var defAsset = "app/assets";

  it('should be an object', function() {
    var newPath = jbPresentDir;
    process.chdir(newPath);
    var plugin = new Plugin({});
    expect(plugin).to.be.ok;
  });

  it('should has #onCompile method', function() {
    var npath = jbPresentDir;
    process.chdir(npath);
    var plugin = new Plugin({});
    expect(plugin.onCompile).to.be.an.instanceof(Function);
  });
  describe("isFileToCompile method", function() {
    it("should manage each .jade file by default", function() {
      var npath = jbPresentDir;
      process.chdir(npath);
      var plugin = new Plugin({});
      expect(plugin.isFileToCompile("app/foo.jade")).to.be.ok;
    });

    it("should manage the file with the extension specified by config", function() {
      var npath = jbPresentDir;
      process.chdir(npath);
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
      var npath = jbPresentDir;
      process.chdir(npath);

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
  describe("getHtmlFilePath method", function() {
    describe("create output in the config.conventions.assets directory", function(){
      it("should get .html from .jade in the 'assets' dir by default", function() {
        var npath = jbPresentDir;
        process.chdir(npath);
        var plugin = new Plugin({});
        expect(plugin.getHtmlFilePath("app/foo.jade",defAsset)).to.equal("app/assets/foo.html");
        expect(plugin.getHtmlFilePath("app/foo.static.jade",defAsset)).to.not.equal("app/assets/foo.html");
      });

      it("should get .html from .jade in the configured assets directory", function() {
        var npath = jbPresentDir;
        var asset = "app/fake_asset";
        process.chdir(npath);
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
      var npath = jbPresentDir;
      process.chdir(npath);
      var plugin = new Plugin({});
      expect(plugin.getHtmlFilePath("app/foo.jade",defAsset)).to.equal("app/assets/foo.html");
      expect(plugin.getHtmlFilePath("app/foo.static.jade",defAsset)).to.not.equal("app/assets/foo.html");
    });

    it("should get .html based on the extension specified in config.coffee", function() {
      var npath = jbPresentDir;
      process.chdir(npath);
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

});
