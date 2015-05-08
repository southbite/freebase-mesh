/**
 * Created by Simon on 5/5/2015.
 */

var MeshError = require('./error');

module.exports = function () {
  return new ComponentInstance();
}

function ComponentInstance() {

	var _this = this;
  _this.system = system;

	//we create base functions

  _this._validateInternal = function(action, data, callback){

    try{

      if (!_this.description[action])
        return callback('Component does not have the action: ' + action);

      //do some schema based validation here
      var schemaValidationFailures = [];
      var inputDataDefinition = _this.description[action];

      for (var parameterDefinition in inputDataDefinition){
        if (parameterDefinition.required && !message.parameters[parameterDefinition.name])
          schemaValidationFailures.push({"parameterDefinition":parameterDefinition, "message":"Required parameter not found"});
      }
      
      if (schemaValidationFailures.length > 0)
        return callback(new MeshError('Schema validation failed', schemaValidationFailures));

      if (_this.module.validate){
        return _this.module.validate(action, data, _this.schema, function(e){
          if (e)
            callback(new MeshError('Component validation failed', e));
        });
      }
        
      callback();

    }catch(e){
      callback(new MeshError('Validation failed',e));
    }
  }

  _this._loadModule = function(module){

    try{

      _this.module = module;

      _this._operateInternal = function(action, data, callback){

        _this._validateInternal(action, data, function(e){

          if (e) return callback(e);

          _this.module[action].call(_this, data, callback);
        });
      }

      /* Happens in the mesh, goes through the description
      for (var action in _this.module.actions){
        _this.mesh.registerAction(parameters.module, action, _this.operateInternal.bind(_this));//to think about...
      }*/

    }catch(e){
      throw e;
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
        description.actions[methodName] = {"parameters":_this.system.util.getFunctionParameters(method)};
        if (_this.schema && _this.schema[methodName]){
          description.actions[methodName].schema = _this.schema[methodName];
        }
      }
    }
  }

  _this._attach = function(){
    //TODO move into mesh
    //attach module to the transport layer
    _this.system.api.on('/' + _this.name + '/*', {event_type:'all'}, function(e, publication){

      var pathParts = publication.path.split('/');
      var message = publication.payload;
      var context = pathParts[1];
      var action = pathParts[2];

      if (context == "request"){
        _this._operateInternal(action, message, function(e, response){
          if (message.responseCallbackURI){
            if (e) return _this.system.api.post(message.responseCallbackURI, e);

            _this.system.api.post(message.responseCallbackURI, response);
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

	_this.initialize = function(name, system, module, schema, options, callback){
    try{

      _this.system = system;
      _this.name = name;

      if (schema)
        _this.schema = schema;

      if (options)
        _this.options = options;

      //we instantiate the actual plugin
      _this._loadModule(module);
      _this._createDescription();
      //_this._attachEvents();


      callback();

    }catch(err){
      callback(new MeshError('Failed to initialize module', {"error":err, "parameters":parameters}));
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