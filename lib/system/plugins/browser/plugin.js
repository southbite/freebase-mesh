module.exports = function () {
  return new Browser();
};

function Browser() {
	var _this = this;

	_this.handleRequest = function(req, res, next){

		next();
	}
};