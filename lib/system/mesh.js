/**
 * Created by Johan on 4/14/2015.
 */

 console.log('TODO logger does not work');
 console.log('TODO how to get poort into freebase');

var freebase = require('freebase');
var freebaseServer = freebase.service;
var dataLayer;
var freebase_client = freebase.client;
var async = require('async');
var MeshError = require('./error');
var Utilities = require('./utilities');
var ComponentInstance = require('./componentInstance');

module.exports = function () {
  return new Mesh();
}

function Mesh() {

	var _this = this;

  //the system is the 'global' variable passed around to all component instances for use
  _this.api = {
    post:function(address, message, callback){

      if (!_this.exchange[address])
        return callback(new MeshError('missing address ' + address));

      _this.exchange[address].deliver(message, callback);
    }
  };

  _this._initializeDataLayer = function(config, callback){
    console.log('init data layer');
    //we instantiate freebase and the local eventemitter client
    try{

      if (!config.dataLayer) config.dataLayer = {};
      if (!config.dataLayer.authTokenSecret) config.dataLayer.authTokenSecret = 'a256a2fd43bf441483c5177fc85fd9d3';
      if (!config.dataLayer.systemSecret) config.dataLayer.systemSecret = 'mesh';
      if (!config.dataLayer.log_level) config.dataLayer.log_level = 'info|error|warning';

      freebaseServer.initialize({
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

  _this._initializeRemoteEndpoints = function(config, callback){
    console.log('init remote endpoints');
    _this.remoteEndpoints = {};

    async.eachSeries(Object.keys(config), function(endpointName, eachCallback) {
        var endpointConfig = config[endpointName];
        //{config:{host:'localhost', port:testport, secret:test_secret}}
         new freebase.client(endpointConfig, function(e, client){

            if (e) return eachCallback(e);

            //provided the remote endpoint is started, we can immediately pull out its description from its data
            client.get('/mesh/' + endpointName + '/description', {}, function(e, response){

               if (e) return eachCallback(e);

               //make sure if the description changes, we know it
               client.on('/mesh/' + endpointName + '/description', {}, function(e, eventData){
                _this.remoteEndpoints[endpointName].description = eventData.payload;
               });

              //we now have a local copy of the distant meshes description
              _this.remoteEndpoints[endpointName] = {
                "data":client,
                "description":response.payload[0].description
              }

              eachCallback();
            });
        });
      }, 
      function(err){
          if (err){
            //message, level, component, data
            _this.api.util.log('Failed to initialize remote endpoints', 'error', 'mesh', err);
            
          }
          callback(err); 
      });
  }

  _this._initializeModules = function(config, callback){
    console.log('init modules');
    _this.modules = {};

    async.eachSeries(Object.keys(config), function(moduleName, eachCallback) {
        var moduleConfig = config[moduleName];
        //{config:{host:'localhost', port:testport, secret:test_secret}}
        var moduleBase = require(moduleConfig.path);
        var constructorCallBack;

        if (moduleConfig.constructor){

          if (moduleConfig.constructor.name)
            moduleBase = moduleBase[moduleConfig.constructor.name];

          //we register our callback
          if (moduleConfig.constructor.type = 'async'){
            constructorCallBack = function(){
              console.log('constructor was called back');
              console.log(arguments);

              for (var index in arguments){
                var value = arguments[index];

                var callBackParameter = moduleConfig.constructor.callback.parameters[index];
                if (callBackParameter == '{error}' && value){
                  return eachCallback(new MeshError('Failed to construct module: ' + moduleName, value));
                }
                  
                if (callBackParameter == '{instance}' && value){
                  _this.modules[moduleName] = value;
                  console.log('modules!!');
                  console.log(_this.modules);
                  return eachCallback();
                }
              }
            }

            var callBackFound = false;
            moduleConfig.constructor.parameters.map(function(parameter, index){
              if (parameter == '{callback}'){
                moduleConfig.constructor.parameters[index] = constructorCallBack;
                callBackFound = true;
              }
            });

            if (!callBackFound) return eachCallback(new MeshError('No callback was specified for async constructor of module: ' + moduleName));

            console.log('moduleConfig.constructor.parameters');
            console.log(moduleConfig.constructor.parameters);

            moduleBase.apply(moduleBase, moduleConfig.constructor.parameters);

          }else{
            _this.modules[moduleName] = new moduleBase(moduleConfig.constructor.parameters);
            eachCallback();
          }
        }else{
           _this.modules[moduleName] = moduleBase;
           eachCallback();
        }
      }, 
      function(err){
          if (err){
            //message, level, component, data
            _this.api.util.log('Failed to initialize modules', 'error', 'mesh', err);
          }
          callback(err);
      });
  }

  _this._instantiateComponents = function(config, callback){
    console.log('init components');
    _this.components = {};

    async.eachSeries(Object.keys(config), function(componentName, eachCallback) {

      console.log({component: componentName});

      var componentConfig = config[componentName];
      var componentInstance = new ComponentInstance();
      componentInstance.mesh = _this.api;

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

  _this._createExchange = function(callback){
    console.log('create exchange');

    _this.exchange = {};

    //we create the local exchange first
    _this._registerMessenger(_this.describe(), _this.api.data);

    //we loop through the remoteEndpoints and register messengers for them
    for (var remoteEndpoint in _this.remoteEndpoints){
      _this._registerMessenger(remoteEndpoint.description, remoteEndpoint.data);
    }

    callback();
  }

  _this._registerDescription = function(meshName, callback){
    _this.api.data.set('/mesh/' + meshName + '/description', null, _this.describe(), function(e, response){
      callback(e);
    });
  }

  _this._registerMessenger = function(meshDescription, endpoint){
    console.log('register messenger');

    //create local exchange
    for (var componentName in meshDescription.components){
      var componentDescription = components[componentName];

      for (var action in componentDescription.actions){
        _this.exchange['/' + meshDescription.name + '/' + componentDescription.name + '/' + action] = new Messenger(endpoint, componentDescription.name, action);
      }
    }
    //we pull together local and remote endpoints, and create a class that enables components to call each other using freebase as the transport layer

    //OR - do we have components just register themselves so they listen with a wildcard
    // SO /local/componentName/*
    // when component A calls component B, a message is generated, containing the parameters, with a per component messageId (numeric)
    // the message also contains a callback url - that has the messageId, this is what the executing component uses to post back its result
    // the component assigns a handler on its 'on' event, that looks for the messageId and runs it
    callback();
  }

  _this._startComponents = function(config, callback){
    console.log('start components');
    callback();
    
  }

	_this.initialize = function(config, callback){

    _this.api.util = new Utilities(config.util);
    _this.config = config;

    async.series([

      //initilize local freebase instance
      function(callback) { _this._initializeDataLayer(config.dataLayer, callback) },

      function(callback) { _this._registerDescription(config.name, callback) },

      //we loop through the external meshes and create freebase clients for them
      function(callback) { _this._initializeRemoteEndpoints(config.remoteEndpoints, callback) },

      function(callback) { _this._initializeModules(config.modules, callback) },

      //we loop through the components in the config and instantiate them
      function(callback) { _this._instantiateComponents(config.components, callback) },

      function(callback) { _this._createExchange(null /* config.? */, callback) },

      function(callback) { _this._startComponents(null /* config.? */, callback) }

    ], callback);

  }

  _this.describe = function(nocache){
    if (_this.description && nocache == false) return _this.description;

    var description = {"name":_this.config.name, "components":{}};

    for (var componentName in _this.api.components){
      description.components[componentName] = _this.api.components[componentName].instance.describe();
    }

    _this.description = description;
    return _this.description;
  }

  //if we are running this mesh in test mode, we iterate through the tests and run them, to return a test report
  _this.test = function(callback){

  }
}
