var Messenger = require('./messenger')
  , async = require('async')
  , _initializeEndpoints
  , _createExchangeAPILayer
  , _createEventAPILayer


module.exports.initialize = function(config, freebase, callback) {

  var client = {
    api: {
      util: {
        log: console.log
      }
    }
  }

  _initializeEndpoints()


}


module.exports._initializeEndpoints = _initializeEndpoints =
  
  function(_this, description, config, freebase, callback) {

  _this.endpoints = {};

  _this.endpoints[config.name] = {
    "data":_this.api.data,
    "description":description,
    "name":config.name
  }

  if (!config.endpoints)
    return callback();

  async.eachSeries(Object.keys(config.endpoints), function(endpointName, eachCallback) {
    var endpointConfig = config.endpoints[endpointName];
    new freebase.client(endpointConfig, function(e, client){
      if (e) return eachCallback(e);
      //provided the remote endpoint is started, we can immediately pull out its description from its data
      client.get('/mesh/' + endpointName + '/description', {}, function(e, response){

        if (e) return eachCallback(e);
        //make sure if the description changes, we know it
        client.on('/mesh/' + endpointName + '/description', {}, function(eventData){
          _this.endpoints[endpointName].description = eventData.payload.data;
        }, function(e){
          if (e) _this.api.util.log('Unable to conect to remote endpoint \''+endpointName+'\' describe event.', 'warn', 'mesh', e);
          //we now have a local copy of the distant meshes description
          try {
            _this.endpoints[endpointName] = {
              "data":client,
              "description":response.payload[0].data, //.description,
              "name":endpointName
            }
          } catch (e) {
            _this.api.util.log('Malformed describe from mesh \''+endpointName+'\' ignored.', 'warn', 'mesh', e);
          }
          eachCallback();
        });
      });
    });
  }, 
  function(err){
      if (err){
        //message, level, component, data
        _this.api.util.log('Failed to initialize remote endpoints', 'error', 'mesh', err);
        return  callback(err); 
      }
      callback();
  });
}

module.exports._createExchangeAPILayer = _createExchangeAPILayer =

  function(_this, callback) {

 _this.exchange = {};

  //we loop through the endpoints and register messengers for them

  async.eachSeries(Object.keys(_this.endpoints), function(endpointName, eachCallback){
    _this.api['exchange'] = {};

    var exchangeAPI = _this.api['exchange'];
    var endPoint = _this.endpoints[endpointName];

    exchangeAPI[endpointName] = {};

    (function(endPoint, endpointName){
      for(var componentName in endPoint.description.components) {
        var componentDescription = endPoint.description.components[componentName];

        (function(componentDescription, componentName){
          exchangeAPI[endpointName][componentName] = {};
          
          for(var methodName in componentDescription.methods) {

            var methodDescription = componentDescription.methods[methodName];
            (function(methodDescription, methodName){
              var methodHandler = function() {

                newArguments = ['/' + endpointName + '/' + componentName + '/' + methodName];
                for(var i in arguments) newArguments.push(arguments[i]);                  
                _this.api.post.apply(null, newArguments);
              }

              exchangeAPI[endpointName][componentName][methodName] =  methodHandler;
              if (methodDescription.alias) exchangeAPI[endpointName][componentName][methodDescription.alias] =  methodHandler;
            
              if(endpointName == _this.config.name){
                if (!exchangeAPI[componentName]) exchangeAPI[componentName] = {};
                exchangeAPI[componentName][methodName] =  methodHandler;
                if (methodDescription.alias) exchangeAPI[componentName][methodDescription.alias] =  methodHandler;
              }

            })(methodDescription, methodName)
          }
        })(componentDescription, componentName)
      }
    })(endPoint, endpointName)

    Messenger.register(_this.endpoints[endpointName], _this.exchange, eachCallback);
  }, callback);
}

module.exports._createEventAPILayer = _createEventAPILayer = 

  function(_this, callback) {

  _this.exchange = {};

  async.eachSeries(Object.keys(_this.endpoints), function(endpointName, eachCallback){

    _this.api['event'] = {};
    var eventAPI = _this.api['event'];
    var endPoint = _this.endpoints[endpointName];

    eventAPI[endpointName] = {};

    (function(endPoint, endpointName){
      for(var componentName in endPoint.description.components) {
        var componentDescription = endPoint.description.components[componentName];

        (function(componentDescription, componentName){
          var eventKey = '/events/' + endpointName + '/' + componentName + '/';

          (function(eventKey){

            var eventHandler = {
              on:function(key, handler, onDone){
                endPoint.data.on(eventKey + key, {event_type:'set'}, handler, onDone);
              },
              off:function(eventRef, offDone){
                endPoint.data.off(eventRef, offDone);
              }
            };

            eventAPI[endpointName][componentName] = eventHandler;
            if(endpointName == _this.config.name) eventAPI[componentName] = eventHandler;
            
          })(eventKey)
        })(componentDescription, componentName)
      }
    })(endPoint, endpointName)

    Messenger.register(_this.endpoints[endpointName], _this.exchange, eachCallback);
  }, callback);
}

