/***********************

http://localhost:3001/mesh/plugins/example/static/test.html

***************************/

var Mesh = require('../lib/system/mesh');
var sep = require('path').sep;

var config = {
  name: 'theFarawayTree',
  dataLayer: {
    port: 3001,
    authTokenSecret: 'a256a2fd43bf441483c5177fc85fd9d3',
    systemSecret: 'mesh',
    log_level: 'info|error|warning'
  },
  endpoints: {},
  modules: {
    // "moonface":{
    //   path:__dirname + "/4-moonface",
    //   constructor:{
    //     type:"sync",
    //     parameters:[]
    //   }
    // },
    "middleware":{
      path:"system:middleware",
      constructor:{
        type:"sync",
        parameters:[{
          value:{
            plugins:{
              "example":{
                // name: "Example Browser Client",
                key: 'example',
                // description: '',
                // image: null,
                entryPoint: __dirname + sep + '7-client-example' + sep + 'plugin.js',
                // options: {},
                staticFolder: 'static'
              }
            }
          }
        }]
      }
    }
  },
  components: {
    // "moonface":{
    //   moduleName:"moonface",
    //   schema:{
    //     "exclusive":false,
    //     "methods":{
    //       "rideTheSlipperySlip": {
    //         parameters: [
    //           {name:'one',required:true},
    //           {name:'two',required:true},
    //           {name:'three',required:true},
    //           {name:'callback', type:'callback', required:true}
    //         ]
    //       }
    //       ,
    //       "haveAnAccident": {
    //         parameters: [
    //           {name:'callback', type:'callback', required:true}
    //         ]
    //       }
    //     }
    //   }
    // },
    "middleware":{
      moduleName:"middleware",
      scope:"component",//either component(mesh aware) or module - default is module
      startMethod:"start",
      schema:{
        "exclusive":false,//means we dont dynamically share anything else
        "methods":{
          "start":{
            "type":"async",
            "parameters":[
             {"type":"callback", "required":true}
            ],
            "callback":{
              "parameters":[
                {"name":"error", "type":"error"}
              ]
            }
          }
        }
      }
    }
  }
};

console.log('REMOTE STARTING, port:', 3001);
(mesh = Mesh()).initialize(config, function(e) {

  if (e) {
    console.log(e.stack);
    process.exit(e.code || 1);
  }

  mesh.api.event.middleware.on('plugins-loaded',
    function(message) {
      console.log({message:message});
    }, 
    function(e) {
      if (e) {
        console.log(e.stack);
        process.exit(e.code || 1);
      }
      mesh.start(function(e) {
        if (e) {
          console.log(e.stack);
          process.exit(e.code || 1);
        }
      });
    }
  );

  console.log('REMOTE READY');

});
