var request = require('request');
var testport = 8080;

var Mesh = require('../../lib/system/mesh');

  var maximumPings = 1000;

  var config = {
    name:"testMiddleware",
    dataLayer: {
      authTokenSecret: 'a256a2fd43bf441483c5177fc85fd9d3',
      systemSecret: 'mesh',
      log_level: 'info|error|warning',
      port:testport
    },
    modules: {
      "api":{
        path:"system:api",
        constructor:{
          type:"sync",
          parameters:[
            {value:{plugins:{}, "testoption":"123"}}//your plugin configs for the middlewares are added here
          ]
        }
      },
      "dashboard":{
        path:"system:dashboard",
        constructor:{
          type:"sync",
          parameters:[
            {value:{plugins:{}, "testoption":"123"}}//your plugin configs for the middlewares are added here
          ]
        }
      }
    },
    components: {
      "api":{
        moduleName:"api",
        scope:"component",//either component(mesh aware) or module - default is module
        startMethod:"start",
        schema:{
          "exclusive":false
        },
        web:{
          routes:{
            "client":"handleRequest",
            "app":"static"
          }
        }
      },
      "dashboard":{
        moduleName:"dashboard",
        scope:"component",//either component(mesh aware) or module - default is module
        startMethod:"start",
        schema:{
          "exclusive":false
        },
        web:{
          routes:{
            "page":"handleRequest",
            "app":"static"
          }
        }
      }
    }
  };

  var mesh = Mesh();

  mesh.initialize(config, function(err) {
	console.log('mesh initialized and started');
  });