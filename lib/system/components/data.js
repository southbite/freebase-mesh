module.exports = function(){
	var _this = this;
	_this.initialize = function(host, port, secret, callback){
		new freebase.client({config:{"host":host, "port":port, "secret":secret}}, function(e, client){
			if (e) return callback(e);

			_this._client = client;
			callback();
		});
	};

	_this.get = function(parameters, callback){
		this.system.data.get(parameters.path, parameters.options, callback);
	};

	// TODO: alias PUT
	_this.set = function(parameters, callback){

		console.log 'IN SET'
		
		path = parameters[0]
		data = parameters[1]

		callback()

		
	};

	_this.delete = function(){

	}
}