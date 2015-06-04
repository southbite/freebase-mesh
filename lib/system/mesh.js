/**
 * Created by Johan on 4/14/2015.
 */

 ////////console.log('TODO logger does not work');
 //////////console.log('TODO how to get poort into freebase');

var freebase = require('freebase');
var freebaseServer = freebase.service;
var dataLayer;
var freebase_client = freebase.client;
var async = require('async');
var MeshError = require('./error');
var Utilities = require('./utilities');
var ComponentInstance = require('./componentInstance');
var Messenger = require('./messenger');

module.exports = function () {
  return new Mesh();
}

function Mesh() {

	var _this = this;

  //the system is the 'global' variable passed around to all component instances for use
  _this.api = {
    post:function(address){

      if (address.substring(0,1) != '/')
        address = '/' + address; 

      if (address.split('/').length == 3)
       address = '/' + _this.config.name + address; 

      if (!_this.exchange[address])
        throw new MeshError('missing address ' + address);

      var messenger = _this.exchange[address];
      messenger.deliver.apply(messenger, arguments);

    }
  };

  _this._initializeDataLayer = function(config, callback){
    ////////console.log('init data layer');
    //we instantiate freebase and the local eventemitter client
    try{

      if (!config.dataLayer) config.dataLayer = {};
      if (!config.dataLayer.authTokenSecret) config.dataLayer.authTokenSecret = 'a256a2fd43bf441483c5177fc85fd9d3';
      if (!config.dataLayer.systemSecret) config.dataLayer.systemSecret = 'mesh';
      if (!config.dataLayer.log_level) config.dataLayer.log_level = 'info|error|warning';

      freebaseServer.initialize({
          port: config.dataLayer.port?config.dataLayer.port:8000,
          host: config.dataLayer.host?config.dataLayer.host:"localhost",
          mode:'embedded', 
          services:{
            auth:{
              path:'./services/auth/service.js',
              config:{
                authTokenSecret:config.dataLayer.authTokenSecret,
                systemSecret:config.dataLayer.systemSecret
              }
            },
            data:{
              path:'./services/data_embedded/service.js'
            },
            pubsub:{
              path:'./services/pubsub/service.js'
            }
          },
          utils:{
            log_level:config.dataLayer.log_level
          }
        }, 
        function(e, freebaseInstance){

          if (e)
            return callback(e);

          //so now all components can talk to the data layer
          new freebase.client({plugin:freebase.client_plugins.intra_process, context:freebaseInstance}, function(e, client){
            if (e) return callback(e);

            _this.api.data = client;
            callback();
          });

        });
    }catch(e){
      callback(e);
    }
  }

  _this._initializeEndpoints = function(config, callback){
    //////console.log('init endpoints');
    //////console.log(config);

    _this.endpoints = {};

    _this.endpoints[config.name] = {
      "data":_this.api.data,
      "description":_this.describe(false),
      "name":config.name
    }

    if (!config.endpoints)
      return callback();

    async.eachSeries(Object.keys(config.endpoints), function(endpointName, eachCallback) {
        var endpointConfig = config.endpoints[endpointName];
        //{config:{host:'localhost', port:testport, secret:test_secret}}
         new freebase.client(endpointConfig, function(e, client){

            if (e) return eachCallback(e);

            //provided the remote endpoint is started, we can immediately pull out its description from its data
            client.get('/mesh/' + endpointName + '/description', {}, function(e, response){

              if (e) return eachCallback(e);

              //make sure if the description changes, we know it
              client.on('/mesh/' + endpointName + '/description', {}, function(e, eventData){


                //this may not work?
                //_this.endpoints[endpointName].description = eventData.payload;
                _this.endpoints[endpointName].description = eventData.payload[0].data;


              }, function(e){if (e) console.log(e.stack);});

              //we now have a local copy of the distant meshes description
              _this.endpoints[endpointName] = {
                "data":client,
                "description":response.payload[0].data, //.description,
                "name":endpointName
              }

              eachCallback();
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

  _this._initializeModules = function(config, callback){
    ////////console.log('init modules');
    _this.modules = {};

    async.eachSeries(Object.keys(config), function(moduleName, eachCallback) {
        ////////console.log(arguments);
        var moduleConfig = config[moduleName];

        //{config:{host:'localhost', port:testport, secret:test_secret}}
        var moduleBase;
        
        try {
          moduleBase = require(moduleConfig.path);
        } catch (e) {
          return eachCallback(e);
        }
        var constructorCallBack;

        if (moduleConfig.constructor){

          if (moduleConfig.constructor.name)
            moduleBase = moduleBase[moduleConfig.constructor.name];

          if (!moduleConfig.constructor.parameters)
            moduleConfig.constructor.parameters = [];

          var callParameters = [moduleConfig.constructor.parameters.length];
          var callbackIndex = -1;

          moduleConfig.constructor.parameters.map(function(parameter, index){
            if (parameter.parameterType == 'callback'){
              callbackIndex = index;
            }else if(parameter.value){
              callParameters[index] = parameter.value;
            }else
              callParameters[index] = null;
          });

          //we register our callback
          if (moduleConfig.constructor.type == 'async'){

            constructorCallBack = function(){
              
              //console.log(arguments);

              for (var index in arguments){
                var value = arguments[index];

                var callBackParameter = moduleConfig.constructor.callback.parameters[index];
                if (callBackParameter.parameterType == 'error' && value){
                  return eachCallback(new MeshError('Failed to construct module: ' + moduleName, value));
                }
                  
                if (callBackParameter.parameterType == 'instance' && value){
                  //moduleName, moduleConfig, moduleInstance
                  _this.modules[moduleName] = value;
                  
                  ////////console.log('modules!!');
                  return eachCallback();
                }
              }
            }

            if (callbackIndex == -1) return eachCallback(new MeshError('No callback was specified for async constructor of module: ' + moduleName));

            callParameters[callbackIndex] = constructorCallBack;
            //console.log('instantiate with async ');
            //console.log(moduleBase);
            moduleBase.apply(moduleBase, callParameters);

          }else{
           
          
           var moduleInstance;

            if (moduleConfig.constructor.context == "new"){
              var constructor = moduleBase.bind.apply(moduleBase, callParameters);
              moduleInstance = new constructor();
            }
            else
              moduleInstance = moduleBase.apply(moduleBase, callParameters);

            _this.modules[moduleName] = moduleInstance;
            eachCallback();
          }
        }else{
          _this.modules[moduleName] = moduleInstance;
          eachCallback();
        }
      }, 
      function(err){
          if (err){
            _this.api.util.log('Failed to initialize modules', 'error', 'mesh', err);
          }
          callback(err);
      });
  }

  _this._instantiateComponents = function(config, callback){
    ////////console.log('init components');
    _this.components = {};

    async.eachSeries(Object.keys(config.components), function(componentName, eachCallback) {

      var componentConfig = config.components[componentName];
     
      var componentInstance = new ComponentInstance();
      componentInstance.mesh = _this.api;
      componentInstance.name = componentName;
      componentConfig.meshName = config.name;

      //console.log('instantiating components');
      //console.log(_this.modules);

      //module, config, callback
      componentInstance.initialize(
        _this.modules[componentConfig.moduleName],
        componentConfig,
        function(e){

          if (e) return eachCallback(e);

          _this.components[componentName] = {"instance":componentInstance, "config":componentConfig};
          eachCallback();

        });
      },
      function(err){
        if (err){
          //message, level, component, data
          _this.api.util.log('Failed to initialize components', 'error', 'mesh', err);
        }
        callback(err);
      });
  }

  _this._createExchangeAPILayer = function(callback){
    //////console.log('create exchange');

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
                ////console.log('COMPARING ENDPOINTNAMES');
                //console.log([endpointName,_this.config.name]);

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

  _this._createEventAPILayer = function(callback){
    //////console.log('create exchange');

    _this.exchange = {};

    //we loop through the endpoints and register messengers for them

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
                  endPoint.data.on(eventKey + key, {event_type:'set'}, function(e, data){

                    if (!e)
                      handler(data);

                  }, onDone);
                },
                off:function(key, offDone){
                  //path, parameters, handler
                  endPoint.data.off(eventKey + key, {event_type:'set'}, offDone);
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

  _this._registerDescription = function(meshName, callback){
    _this.api.data.set('/mesh/' + meshName + '/description', _this.describe(false), null, function(e, response){
      callback(e);
    });
  }

  _this._startComponents = function(callback){
    //////console.log('start components');

    async.eachSeries(Object.keys(_this.components), function(componentName, eachCallback){

      var component = _this.components[componentName];
      var config = component.config;

      if (config.startMethod){

        if (!config.schema.methods[config.startMethod])
          eachCallback(new MeshError("start method " + config.startMethod + " not found for component " + componentName));

        var startMethodConfig = config.schema.methods[config.startMethod];
        var startParameters = startMethodConfig.parameters?startMethodConfig.parameters:[];

        if (startMethodConfig.type == "sync"){
          try{
             component.instance.operate(config.startMethod, startMethodConfig.parameters);
             eachCallback();
          }catch(e){
            eachCallback(e);
          }
        }else{
          component.instance.operate(config.startMethod, startMethodConfig.parameters, function(e, response){
            if (e){
              eachCallback(e);
            }else{
              eachCallback();
            }
          });
        }
      }else eachCallback();

    }, callback);
  }

  _this._stopComponents = function(callback){

  }

  _this.stop = function(options, callback){

    //options.force
    //options.forceWaitMilliseconds

    if (!options)
      options = {};

    if (options.force && !options.forceWaitMilliseconds)
      options.forceWaitMilliseconds = 10000;

    var timeout;

    if (options.force){
      timeout = setTimeout(function(){
        process.exit(1);
      }, options.forceWaitMilliseconds);
    }
      
    _this._stopComponents(function(e){
      if (e){
        _this.util.log("Failure to stop components ", "error", "mesh", e);
        process.exit(1);
      }else{
        _this.util.log("Stopped components successfully", "info", "mesh");
        process.exit(0);
      }
    });
  }

  _this.initialize = function(config, callback){

    _this.api.util = new Utilities(config.util);
    _this.config = config;

    async.series([

      //initilize local freebase instance
      function(callback) { _this._initializeDataLayer(config, callback) },

      function(callback) { _this._initializeModules(config.modules, callback) },

      function(callback) { _this._instantiateComponents(config, callback) },

      function(callback) { _this._initializeEndpoints(config, callback) },

      function(callback) { _this._registerDescription(config.name, callback) },

      function(callback) { _this._createExchangeAPILayer(callback) },

      function(callback) { _this._createEventAPILayer(callback) }

    ], function(e){
      if (!e)  console.log('mesh up...');
      callback(e);
    });
  }

	_this.start = function(callback){
   _this._startComponents(callback);
  }

  _this.describe = function(cached){
    if (_this.description && cached == true) return _this.description;

    var description = {"name":_this.config.name, "components":{}};

    for (var componentName in _this.components){
      description.components[componentName] = _this.components[componentName].instance.describe();
    }

    _this.description = description;
    return _this.description;
  }

  //if we are running this mesh in test mode, we iterate through the tests and run them, to return a test report
  _this.test = function(callback){

  }
}
