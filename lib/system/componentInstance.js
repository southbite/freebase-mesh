/**
 * Created by Simon on 5/5/2015.
 */

var MeshError = require('./error');

module.exports = function () {
  return new ComponentInstance();
}

function ComponentInstance() {

	var _this = this;
  //_this.system = system;

	//we create base functions

  _this._getParameters = function(action, message, callback){

    try{

      if (!_this.description[action])
        throw new MeshError('Component does not have the action: ' + action);

      //do some schema based validation here
      var schemaValidationFailures = [];
      var inputDataDefinition = _this.description[action];

      for (var parameterDefinition in inputDataDefinition){
        if (parameterDefinition.required && !message.parameters[parameterDefinition.name])
          schemaValidationFailures.push({"parameterDefinition":parameterDefinition, "message":"Required parameter not found"});
      }
      
      if (schemaValidationFailures.length > 0)
        throw new MeshError('Schema validation failed', schemaValidationFailures);

      if (_this.module.validate) _this.module.validate(action, message, _this.config.schema);


      //we create a parameter array in the right order, the last parameter is always the callback one
      var parameters = [];

      for (var parameterName in inputDataDefinition.parameters){
        parameters.push(message.parameters[parameterName]);
      }
      
      parameters[parameters.length -1] = callback;
      return parameters;

    }catch(e){
      throw new MeshError('Validation failed',e);
    }
  }

  _this._loadModule = function(module){

    _this.module = module;
    
    _this.operate = function(action, message, callback){
      try{
        var operationParameters = _this._getParameters(action, message, callback);
        _this.module[action].apply(_this.module, operationParameters);
      }catch(e){
        callback(new MeshError('Call to action ' + action + ' failed', e));
      }
    }
  }

  _this.describe = function(){
    //we loop through the modules actions and if there is a schema, we map inputs and ouputs  
    return _this.description;
  }

  _this._createDescription = function(){

    var description = {"actions":{}};
    //TODO eliminate properties
    for (var methodName in _this.module){
      var method = _this.module[methodName];
      if (methodName.indexOf('_') != 0 && typeof _this.module[methodName] == 'function'){
        description.actions[methodName] = {"parameters":_this.mesh.util.getFunctionParameters(method)};
        if (_this.config.schema && _this.config.schema[methodName]){
          description.actions[methodName].schema = _this.config.schema[methodName];
        }
      }
    }
  }

  _this._attach = function(){
    //TODO move into mesh
    //attach module to the transport layer
    _this.mesh.data.on('/' + _this.config.name + '/*', {event_type:'all'}, function(e, publication){

      var pathParts = publication.path.split('/');
      var message = publication.payload;
      var context = pathParts[1];
      var action = pathParts[2];

      if (context == "request"){

        if (!message.responseCallbackURI)
          throw new MeshError('responseCallbackURI not set for request');

         _this.operate(action, message, function(e, response){
          if (message.responseCallbackURI){
            if (e) return _this.mesh.api.post(message.responseCallbackURI, {"status":"failed", "data":e});

            _this.mesh.api.post(message.responseCallbackURI, {"status":"ok", "data":response});
          }
        });

      }

      if (context == "response"){
        var requestId = pathParts[3];
        _this.handleResponse(requestId, message.error, message.response);
      }

      //TODO - controls discovers etc.
      if (context == "system"){

      }

    });
  }

	_this.initialize = function(module, config, callback){

    try{
      _this.config = config;
     
      //we instantiate the actual plugin
      _this._loadModule(module);
      _this._createDescription();
      _this._attach();
      //_this._attachEvents();
      callback();

    }catch(err){
      callback(new MeshError('Failed to initialize module', err));
    }
  }

  _this.startInternal = function(){
    if (_this.description['start']){

        //TODO check description for start function presence
        return _this.module.start.call(_this.module, parameters, function(err){
          if (e) return callback(new MeshError('Failed to start module', {"error":err, "parameters":parameters}));

          callback();
        });
      }
  }

  _this.runTestInternal = function(callback){
    try{

      if (!_this.module.runTest)
        return callback(new MeshError('Module is not testable'));

      _this.module.runTest(callback);

        _this.operateInternal(data.message, data.parameters, function(e, result){

          if (e)
            return callback(e);

          if (_this.module.verifyTestResults)
            return _this.module.verifyTestResults(result, callback);

          callback(null, result);
          
        });


    }catch(e){
      callback(e);
    }
  }

}