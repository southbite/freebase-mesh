// browser friendly

// var async;
var Messenger;
var freebase;

if (typeof UTILITIES === 'undefined') {
  UTILITIES = {
    log: function() {
      console.log.apply(console, arguments);
    }
  };
}

if (typeof window === 'undefined') {
  Messenger = require('./messenger');
  freebase = require('freebase');
  async = require('async');
} else {
  // Messenger = 
  // async =
  // freebase = 
  module = {exports:{}}

  function getScript(url, success){
   var script=document.createElement('script');
   script.src=url;
   var head=document.getElementsByTagName('head')[0];
   var done=false;
   // Attach handlers for all browsers
   script.onload=script.onreadystatechange = function(){
     if ( !done && (!this.readyState || this.readyState == 'loaded' || this.readyState == 'complete') ) {
      done=true;
      success();
      script.onload = script.onreadystatechange = null;
      head.removeChild(script);
     }
   };
   head.appendChild(script);
  }
}

function MeshAPI(config, callback) {

  delete module.exports; // in the browser, async will use it instead of window

  var client = {};
  var loadResources = function() {
    async.parallel([
      function(cb) {
        if (typeof $ === 'undefined') {
          getScript('//cdnjs.cloudflare.com/ajax/libs/jquery/2.1.4/jquery.min.js', function() {
            UTILITIES.log('MeshAPI: loaded jquery.');
            cb();
          }); 
        }
        else cb();
      }//,
      // function(cb) {
      //   if (typeof freebase === 'undefined') {
      //     getScript(' URL ', function() {
      //       UTILITIES.log('MeshAPI: loaded freebase.');
      //       cb();
      //     }); 
      //   }
      //   else cb();
      // },
      // function(cb) {
      //   if (typeof Messenger === 'undefined') {
      //     getScript(' URL ', function() {
      //       UTILITIES.log('MeshAPI: loaded messenger.');
      //       cb();
      //     }); 
      //   }
      //   else cb();
      // },
    ],

    function(e) {
      if (e) return callback(e);
      // initialize(client, config, freebase, callback);
      callback(null, client);
    });
  }

  if (typeof async === 'undefined') {
    getScript('http://cdnjs.cloudflare.com/ajax/libs/async/1.2.1/async.min.js', function(){
      UTILITIES.log('MeshAPI: loaded async.');
      loadResources();
    });
  } else loadResources();
  
}

module.exports = MeshAPI;

var initialize = function(client, config, freebase, callback) {

  var description = {name: 'browser'}; // passed in?
  var client = {
    config: config,
    api: {
      data: {
        on: function() {
          // stub calls to local (browserside) mesh freebase
          console.error('browser client does not run own endpoint');
          console.error("on '%s' with:", event, arguments);
          arguments[3]();
        }
      }
    }
  }

  MeshAPI._initializeEndpoints(client, description, freebase, config, function(e) {
    if (e) return callback(e);
    MeshAPI._createExchangeAPILayer(client, function(e) {
      if (e) return callback(e);
      MeshAPI._createEventAPILayer(client, function(e) {
        if (e) return callback(e);
        callback(null, client);
      });
    });
  });
}


Object.defineProperty(MeshAPI, '_initializeEndpoints', {
  value: function(_this, description, freebase, config, callback) {

    _this.api.post = function(address){

      if (address.substring(0,1) != '/')
        address = '/' + address; 

      if (address.split('/').length == 3)
       address = '/' + _this.config.name + address; 

      if (!_this.exchange[address])
        throw new MeshError('missing address ' + address);

      var messenger = _this.exchange[address];
      messenger.deliver.apply(messenger, arguments);

    }

    _this.endpoints = {};

    if (config.name) {
      _this.endpoints[config.name] = {
        "data":_this.api.data,
        "description":description,
        "name":config.name
      }
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
            if (e) UTILITIES.log('Unable to conect to remote endpoint \''+endpointName+'\' describe event.', 'warn', 'mesh', e);
            //we now have a local copy of the distant meshes description
            try {
              _this.endpoints[endpointName] = {
                "data":client,
                "description":response.payload[0].data, //.description,
                "name":endpointName
              }
            } catch (e) {
              UTILITIES.log('Malformed describe from mesh \''+endpointName+'\' ignored.', 'warn', 'mesh', e);
            }
            eachCallback();
          });
        });
      });
    }, 
    function(err){
        if (err){
          //message, level, component, data
          UTILITIES.log('Failed to initialize remote endpoints', 'error', 'mesh', err);
          return  callback(err); 
        }
        callback();
    });
  }
});


Object.defineProperty(MeshAPI, '_createExchangeAPILayer', {
  value: function(_this, callback) {

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
});


Object.defineProperty(MeshAPI, '_createEventAPILayer', {
  value: function(_this, callback) {

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
});