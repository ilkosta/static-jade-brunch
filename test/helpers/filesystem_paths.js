module.exports = function(chai, utils) {
	var Assertion = chai.Assertion;

	Assertion.addMethod( 'match_filesystem_path', function(other) {
		var sysPath = require("path");

		var obj = this._obj;
		new Assertion(obj).to.be.a('string');
		new Assertion(other).to.be.a('string');

		var this_path = sysPath.normalize(obj);
		var other_path = sysPath.normalize(other);

		this.assert(
				this_path == other_path
			,	"expected filesystem path: #{exp} to match the filesystem path: #{act}"
			,	"expected filesystem path: #{exp} to not match the filesystem path: #{act}"
			,	this_path
			,	other_path
		);
	});
};
