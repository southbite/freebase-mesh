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
  _this.system = {};

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
        function(e, freebase){

          if (e)
            return callback(e);

          dataLayer = freebase;

          console.log('TODO - freebase.client_plugins does not exist')

          //so now all components can talk to the data layer
          //_this.system.data = new freebase.client({plugin:freebase.client_plugins.intra_process, context:dataLayer}, function(e){
          callback(e);
          //});

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
        _this.remoteEndpoints[endpointName] = new freebase.client(endpointConfig, function(e){
            eachCallback(e);
        });
      }, 
      function(err){
          if (err){
            //message, level, component, data
            _this.system.util.log('Failed to initialize remote endpoints', 'error', 'mesh', err);
            
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
        _this.modules[moduleConfig.name] = require(moduleConfig.path);
      }, 
      function(err){
          if (err){
            //message, level, component, data
            _this.system.util.log('Failed to initialize modules', 'error', 'mesh', err);
          }
          callback(err);
      });
  }

  _this._instantiateComponents = function(config, callback){
    console.log('init components');
    _this.system.components = {};

    async.eachSeries(Object.keys(config), function(componentName, eachCallback) {

      console.log({component: componentName});

      var componentConfig = config[componentName];
      var componentInstance = new ComponentInstance();

      //system, module, schema, options, callback
      componentInstance.initialize(
        _this.system,
        _this.modules[componentConfig.moduleName],
        componentConfig.schema,
        componentConfig.options,
        function(e){

          if (e) return eachCallback(e);

          _this.system.components[componentName] = {"instance":componentInstance, "config":componentConfig};
          eachCallback();

        });
      },
      function(err){
        if (err){
          //message, level, component, data
          _this.system.util.log('Failed to initialize components', 'error', 'mesh', err);
        }
        callback(err);
      });
  }

  _this._createCallMatrix = function(config, callback){
    console.log('create call matrix');
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

    _this.system.util = new Utilities(config.util);
    _this.config = config;

    async.series([

      //initilize local freebase instance
      function(callback) { _this._initializeDataLayer(config.dataLayer, callback) },

      //we loop through the external meshes and create freebase clients for them
      function(callback) { _this._initializeRemoteEndpoints(config.remoteEndpoints, callback) },

      
      function(callback) { _this._initializeModules(config.modules, callback) },

      //we loop through the components in the config and instantiate them
      function(callback) { _this._instantiateComponents(config.components, callback) },

      function(callback) { _this._createCallMatrix(null /* config.? */, callback) },

      function(callback) { _this._startComponents(null /* config.? */, callback) }

    ], callback);

  }

  _this.describe = function(nocache, callback){
    if (_this.description && nocache == false) return _this.description;

    var description = {"name":_this.config.name, "components":{}};

    for (var componentName in _this.system.components){
      description.components[componentName] = _this.system.components[componentName].instance.describe();
    }

    _this.description = description;
    return _this.description;
  }

  //if we are running this mesh in test mode, we iterate through the tests and run them, to return a test report
  _this.test = function(callback){

  }
}
