var path = require("path");

describe('Plugin', function() {
  var plugin;
  var startingDir = process.cwd();

  it('should be an object', function() {
    var newPath = path.join(startingDir, 'test/jade-brunch/present');
    process.chdir(newPath);
    plugin = new Plugin({});
    expect(plugin).to.be.ok;
  });

  it('should has #onCompile method', function() {
    var npath = path.join(startingDir, 'test/jade-brunch/present');
    process.chdir(npath);
    plugin = new Plugin({});
    expect(plugin.onCompile).to.be.an.instanceof(Function);
  });
});

// describe('jade-brunch co-existence', function(){
//   var startingDir = process.cwd();
//   function mkPlugin() {
//     var plugin = new Plugin({});
//   }
//   it('should throw an exception if jade-brunch is not present', function() {
//     expect( mkPlugin ).toThrow();
//   });
// });