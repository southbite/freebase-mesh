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

	_this.put = function(){

	};

	_this.delete = function(){

	}
}