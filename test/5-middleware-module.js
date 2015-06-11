var request = require('request');
var testport = 8080;


describe('Demonstrates the middleware functionality', function(done) {
///events/testComponent2Component/component1/maximum-pings-reached
///events/testComponent2Component/component1/maximum-pings-reached
  var Mesh = require('../lib/system/mesh');

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
      "middleware":{
        path:"system:middleware",
        constructor:{
          type:"sync",
          parameters:[
            {value:{plugins:{}, "testoption":"123"}}//your plugin configs for the middlewares are added here
          ]
        }
      }
    },
    components: {
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

  var mesh = Mesh();

  it('starts the mesh, loads the middleware module - which loads the browser plugin', function(done) {

    this.timeout(15000);

    var onEventRef;

    mesh.initialize(config, function(err) {

      if (err) {
        console.log(err.stack);
        done(err);
      }else{

        mesh.api.event.middleware.on('plugins-loaded', function(message){
          //'/mesh/plugins/' + pluginConfig.key + '/static'
          var url = 'http://127.0.0.1:' + testport + '/mesh/plugins/api';
          console.log('connecting to ' + url);
          require('request')({uri:url,
           method:'GET'
          }, 
          function(e, r, b){

            if (!e){
              console.log('got body!!!');
              console.log(b);
              done();
            }else
              done(e);
      
          });
        }, 
        function(err, ref){
          if (err){
             console.log('Couldnt attach to event plugins-loaded');
             done(err);
          }else{
            //we have attached our events, now we start the mesh
            console.log('attached on ok, ref: ' + ref);
            onEventRef = ref;
            //console.log(mesh.api.data.events);
            mesh.start(function(err) {
               if (err) {
                console.log('Failed to start mesh');
                done(err);
              }
            });
          }
        });
      }
    });
  });
});