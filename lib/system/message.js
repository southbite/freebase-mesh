module.exports = function(path, index, parameters, group, data){

}

function Message(path, data, parameters, index, group){
	var _this = this;

	if (!path)
		throw new Exception("Message has no path");

	var pathSegments = path.split('/');

	if (pathSegments.length == 1)
		throw new Exception('Invalid path, needs at least 2 segments [/component/action]');

	if (!data)
		throw new Exception("Message has no data");

	_this.path = path;

	if (pathSegments.length == 2){
		_this.exchangeId = 'local';
		_this.componentName = pathSegments[0];
		_this.componentAction = pathSegments[1];
	}

	if (pathSegments.length == 3){
		_this.exchangeId = pathSegments[0];
		_this.componentName = pathSegments[1];
		_this.componentAction = pathSegments[2];
	}
		
	_this.data = data;
	_this.index = index?index:0;
	_this.group = group?group:0;
	_this.parameters = parameters?parameters:{};

}