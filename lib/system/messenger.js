//TODO utilities
var shortId = require('shortid')

module.exports.register = function(endpoint, exchange, callback){
	return new Messenger(endpoint, exchange, callback);
}

function Messenger(endpoint, exchange, callback){
	var _this = this;

	_this._endpoint = endpoint;
	_this._exchange = exchange;
	_this._meshDescription = endpoint.description;
	_this.handlers = {};

	//////console.log('A Messenger...');
	//////console.log(_this);

	_this.deliver = function(address){
		//////console.log('delivering message');
		//////console.log(arguments);

		var args = [];
	    for (var argIndex in arguments){
	      if (argIndex > 0)
	        args[argIndex - 1] = arguments[argIndex];
	    }

	    _this.handlers[address](args);

		//message.response = 'All good';
		//callback(null, message);
	}

	_this.responseHandlers = {};

	_this.discardMessage = function(address, methodDescription, args, error){
		//TODO - fix discarded message
		//////console.log('Message discarded');
		//////console.log(arguments);
	}

	_this._validateMessage = function(methodDescription, args){

	    try{

	      if (!methodDescription)
	        throw new MeshError('Component does not have the method: ' + method);

	      //do some schema based validation here
	      var schemaValidationFailures = [];
	     
	      methodDescription.parameters.map(function(parameterDefinition, index){

	         if (parameterDefinition.required && !args[index])
	          schemaValidationFailures.push({"parameterDefinition":parameterDefinition, "message":"Required parameter not found"});

	      });

	      if (schemaValidationFailures.length > 0)
	        throw new MeshError('Schema validation failed', schemaValidationFailures);

	    }catch(e){
	      throw new MeshError('Validation failed', e);
	    }
	}

	_this.prepareMessage = function(address, methodDescription, args){

		_this._validateMessage(methodDescription, args);

		var message = {"callbackAddress":'/mesh/system/responses' + address + '/' + shortId.generate(), args:[]};

		methodDescription.parameters.map(function(parameterDescription, index){

			if (parameterDescription["type"] == 'callback'){

				if (!args[index])
					throw new MeshError('Callback for ' + address + ' was not defined');

				var callbackHandler = {
					"handler":args[index],
					"callbackAddress":message.callbackAddress
				};

				callbackHandler.handleResponse = function(argumentsArray){
					clearTimeout(this.timedout);
					
					return this.handler.apply(this.handler, argumentsArray);
				}.bind(callbackHandler);

				callbackHandler.timedout = setTimeout(function(){
					//////console.log('CALLBACK HANDLER TIMED OUT..SUCCESSFULLY');
					delete _this.responseHandlers[this.callbackAddress];
					//////console.log(this);
					return this.handler("Request timed out");
				}.bind(callbackHandler), 5000);

				//TODO - make timeout configurable
				_this.responseHandlers[message.callbackAddress] = callbackHandler;

			}
			else
				message.args.push(args[index]);
		});

		return message;
	}

	for (var componentName in _this._meshDescription.components){
		var componentDescription = _this._meshDescription.components[componentName];

		for (var methodName in componentDescription.methods){

			var methodDescription = componentDescription.methods[methodName];
			var address = '/' + _this._endpoint.name + '/' + componentName + '/' + methodName;

			(function(methodDescription, address){
				//TODO - handle aliasing here...
				_this.handlers[address] = function(){

					var message;

					try{
						message = _this.prepareMessage(address, methodDescription, arguments[0]);
					}catch(e){
						return _this.discardMessage(address, methodDescription, arguments[0], e);
					}

					endpoint.data.set('/mesh/system/requests' +  address, message, {noStore:true}, function(e, response){
						if (e) return message.callback(e);
					});
				}

			})(methodDescription, address);

			exchange[address] = _this;
		}
	};

	endpoint.data.on('/mesh/system/responses/' + endpoint.description.name + '/*', 
		{event_type:'set', count:0}, 
		function(e, response){
			//handler
			var responseHandler = _this.responseHandlers[response.path];

			if (responseHandler){

				console.log(response.data.arguments);

				if (response.data.status == 'ok'){
					responseHandler.handleResponse(response.data.arguments);
				}else{
					//TODO - if it breaks we must map to the error in the callback
				}
			}
		}, 
		function(e){
			//if the on worked
			callback(e);
		}
	);
}