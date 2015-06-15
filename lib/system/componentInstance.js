/**
 * Created by Simon on 5/5/2015.
 */

var MeshError = require('./error');
var serveStatic = require('serve-static');

module.exports = function () {
  return new ComponentInstance();
}

function ComponentInstance() {

	var _this = this;
  var _description;
  
  _this._loadModule = function(module){

    _this.module = module;
    
    _this.operate = function(method, parameters, callback){
      try{

        methodSchema = _description.methods[method];

        if (callback){
          callbackIndex = -1;

          for(var i in methodSchema.parameters) {
            if(methodSchema.parameters[i].type == 'callback') callbackIndex = i
          };

          var callbackProxy = function(){
            var returnArgs = [];
            for (var argIndex in arguments)
              returnArgs.push(arguments[argIndex]);
            callback(null, returnArgs);
          }

          if(callbackIndex == -1) {
            parameters.push(callbackProxy)
          }
          else parameters.splice(callbackIndex, 1, callbackProxy);
        }
        
        if (_this.config.scope == "component")
          _this.module.instance[method].apply(_this, parameters);
        else
          _this.module.instance[method].apply(_this.module.instance, parameters);

      }catch(e){
        var error = new MeshError('Call to method ' + method + ' failed', e);

        UTILITIES.log('Call to method ' + method + ' failed in ' + _this.name, "error", _this.name, error);

        if (callback)
          callback(e);

        //else throw error;
        //
        //TODO - for syncronous calls may still want to throw, but it takes down the mesh
      }
    }
  }

  _this.describe = function(cached){

    if (!cached || !_description){
      _description = {"methods":{}};

      for (var methodName in _this.module.instance){
        var method = _this.module.instance[methodName];
        if (methodName.indexOf('_') != 0 && typeof _this.module.instance[methodName] == 'function'){

          if (_this.config.schema && _this.config.schema.methods){
            var methodSchema = _this.config.schema.methods[methodName];

            if (_this.config.schema.exclusive && !methodSchema)
              continue;

            if (methodSchema){
              _description.methods[methodName] = methodSchema;
               continue;
            }
          }

          _description.methods[methodName] = {"parameters":[]};

          UTILITIES.getFunctionParameters(method).map(function(functionName){
            _description.methods[methodName].parameters.push({name:functionName});
          });
        }
      }
    }
    return _description;
  }

  _this.emit = function(key, data, callback){
    var eventKey = '/events/' + _this.config.meshName + '/' + _this.name + '/';
    _this.mesh.data.set(eventKey + key, data, {noStore:true}, callback);
  }

  _this._discardMessage = function(reason, message){
    _this.mesh.api.util.log("message discarded: " + reason, "error", "componentInstance", message);
  }


  _this._attach = function(config, callback){
    //attach module to the transport layer

    //console.log('in attach');
    //console.log(config);

    if (config.web){
      try{
          for (var route in config.web.routes){
            var routeTarget = config.web.routes[route];
            var meshRoutePath = '/' + config.meshName+'/'+_this.name+'/'+route;
            var componentRoutePath = '/' + _this.name+'/'+route;
            //console.log('ATTACHING TO ROUTE: ' + route);

            //console.log(config.web.routes);

            if (routeTarget == 'static'){
              //console.log('attaching static');
              //console.log(_this.module.directory + '/' + route);
              this.mesh.data.context.connect.use(meshRoutePath, serveStatic(_this.module.directory + '/' + route));
              this.mesh.data.context.connect.use(componentRoutePath, serveStatic(_this.module.directory + '/' + route));
            }else{
              this.mesh.data.context.connect.use(meshRoutePath, _this.module.instance[routeTarget].bind(_this.module.instance));
              this.mesh.data.context.connect.use(componentRoutePath, _this.module.instance[routeTarget].bind(_this.module.instance));
            }
          } 
      }catch(e){
        UTILITIES.log("Failure to set attach modules web methods to component: " + _this.name, "error", _this.name, message);
        return callback(e);
      }
    }

    var listenAddress = '/mesh/system/requests/' + config.meshName +  '/' + _this.name + '/';
  
    _this.mesh.data.on(listenAddress + '*', 
    {event_type:'set'}, 
    function(publication){

      var pathParts = publication.payload.path.replace(listenAddress, '').split('/');
      var message = publication.payload.data;
      var method = pathParts[0];

      if (!message.callbackAddress)
        return _this._discardMessage('No callback address', message);

      _this.operate(method, message.args, function(e, responseArguments){

          if (e) {
            // error objects cant be sent / received  (serialize)
            var serializedError = {
              message: e.message,
              name: e.name,
              stack: e.stack
            }
            Object.keys(e).forEach(function(key) {
              serializedError[key] = e[key];
            });
            return _this.mesh.data.set(message.callbackAddress, {"status":"failed", "arguments":[serializedError]});
          }
          _this.mesh.data.set(message.callbackAddress, {"status":"ok", "arguments":responseArguments}, null, function(e){
            if (e)
              UTILITIES.log("Failure to set callback data in component " + _this.name, "error", _this.name, message);
          });
      });
    },
    function(e){
      callback(e);
    });
  }

	_this.initialize = function(module, config, callback){

    try{
      _this.config = config;

      //we instantiate the actual plugin
      _this._loadModule(module);
      _this._attach(config, callback);
    }catch(err){
      callback(new MeshError('Failed to initialize component', err));
    }
  }

  _this.runTestInternal = function(callback){
    try{

      if (!_this.module.instance.runTest)
        return callback(new MeshError('Module is not testable'));

      _this.module.instance.runTest(callback);

        _this.operateInternal(data.message, data.parameters, function(e, result){

          if (e)
            return callback(e);

          if (_this.module.instance.verifyTestResults)
            return _this.module.instance.verifyTestResults(result, callback);

          callback(null, result);
          
        });


    }catch(e){
      callback(e);
    }
  }

}