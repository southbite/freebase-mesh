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

  _this._loadModule = function(module){

    _this.module = module;
    
    _this._operate = function(method, parameters, callback){
      try{

        console.log('IN OPERATE');
        console.log([method, parameters, callback]);

        _this.module[method].apply(_this.module, parameters);
      }catch(e){
        callback(new MeshError('Call to action ' + action + ' failed', e));
      }
    }

    ////console.log('Loaded module');
  }

  var _description;
  _this.describe = function(cached){

    //console.log('describing comp');
    //console.log(_this.config);
    //console.log(_this.config.schema);
    //console.log(_this.config.schema.exclusive);

    if (!cached || !_description){
      _description = {"methods":{}};
      //TODO eliminate properties
      for (var methodName in _this.module){
        var method = _this.module[methodName];
        if (methodName.indexOf('_') != 0 && typeof _this.module[methodName] == 'function'){
          if (_this.config.schema){
            var methodSchema = _this.config.schema.methods[methodName];

            //console.log('methodSchema!!!');
            //console.log(methodSchema);

            if (_this.config.schema.exclusive && !methodSchema)
              continue;

            if (methodSchema){
              _description.methods[methodName] = methodSchema;
               continue;
            }
          }

          _description.methods[methodName] = {"parameters":[]};

          //console.log('func params');
          //console.log(_this.mesh.util.getFunctionParameters(method));

          _this.mesh.util.getFunctionParameters(method).map(function(functionName){
            //console.log('func param: ' + functionName);
            _description.methods[methodName].parameters.push({name:functionName});
          });
        }
      }
    }

    //console.log('done describing comp');
    //console.log(_description);
    return _description;
    
  }

  _this._discardMessage = function(reason, message){
    //TODO - handle discarded messages
    console.log('message discarded: ' + reason);
    console.log(message);
  }

  ///mesh/system/requests/testMesh/freebaseClient/set
  ///mesh/system/requests/testMesh/freebaseClient/*

  _this._attach = function(config, callback){
    //TODO move into mesh
    //attach module to the transport layer

    console.log('attaching..');
    var listenAddress = '/mesh/system/requests/' + config.meshName +  '/' + _this.name + '/';
    console.log(listenAddress);

    _this.mesh.data.on(listenAddress + '*', 
    {event_type:'set'}, 
    function(e, publication){

      if (e)
        return _this._discardMessage('Error on condition', publication);

      var pathParts = publication.path.replace(listenAddress, '').split('/');
      var message = publication.data;
      var method = pathParts[0];
     
      console.log('ON HAPPENED IN COMP INSTANCE');
      console.log([message,method]);

      if (!message.callbackAddress)
        return _this._discardMessage('No callback address', message);

      _this._operate(method, message.args, function(e, response){
          if (e) return _this.mesh.data.set(message.callbackAddress, {"status":"failed", "data":e});
          _this.mesh.data.set(message.callbackAddress, {"status":"ok", "data":response});
      });

    },
    function(e){
      console.log('ON was successful');
      console.log(e);
      callback(e);
    });

  }

	_this.initialize = function(module, config, callback){

    try{

      ////console.log(arguments);

      _this.config = config;

      //we instantiate the actual plugin
      _this._loadModule(module);
      _this._attach(config, callback);
      //_this._attachEvents();
      ////console.log('component initialized');
      ////console.log(callback.toString());
     

    }catch(err){
      callback(new MeshError('Failed to initialize component', err));
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