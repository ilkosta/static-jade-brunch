var path = require("path");

describe('Plugin', function() {
  var startingDir = process.cwd();

  it('should be an object', function() {
    var newPath = path.join(startingDir, 'test/jade-brunch/present');
    process.chdir(newPath);
    var plugin = new Plugin({});
    expect(plugin).to.be.ok;
  });

  it('should has #onCompile method', function() {
    var npath = path.join(startingDir, 'test/jade-brunch/present');
    process.chdir(npath);
    var plugin = new Plugin({});
    expect(plugin.onCompile).to.be.an.instanceof(Function);
  });
  describe("isFileToCompile method", function() {
    it("should manage each .jade file by default", function() {
      var npath = path.join(startingDir, 'test/jade-brunch/present');
      process.chdir(npath);
      var plugin = new Plugin({});
      expect(plugin.isFileToCompile("app/foo.jade")).to.be.ok;
    });

    it("should manage the file with the extension specified by config", function() {
      var npath = path.join(startingDir, 'test/jade-brunch/present');
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
      var npath = path.join(startingDir, 'test/jade-brunch/present');
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
    it("should get .html from .jade file by default", function() {
      var npath = path.join(startingDir, 'test/jade-brunch/present');
      process.chdir(npath);
      var plugin = new Plugin({});
      expect(plugin.getHtmlFilePath("app/foo.jade")).to.equal("app/assets/foo.html");
      expect(plugin.getHtmlFilePath("app/foo.static.jade")).to.not.equal("app/assets/foo.html");
    });

    it("should get .html based on the extension specified in config.coffee", function() {
      var npath = path.join(startingDir, 'test/jade-brunch/present');
      process.chdir(npath);
      var plugin = new Plugin({
        plugins: {
          static_jade: {
            extension: ".static.jade"
            }
        }
      });
      expect(plugin.getHtmlFilePath("app/foo.jade")).to.not.equal("app/assets/foo.html");
      expect(plugin.getHtmlFilePath("app/foo.static.jade")).to.equal("app/assets/foo.html");
    });
  });

});
