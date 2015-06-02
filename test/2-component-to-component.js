var Mesh = require('../lib/system/mesh');

var config = {
    name:"testComponent2Component",
    dataLayer: {
      authTokenSecret: 'a256a2fd43bf441483c5177fc85fd9d3',
      systemSecret: 'mesh',
      log_level: 'info|error|warning'
    },
    endpoints: {},
    modules: {
      "module1":{
        scope:{
          variableName:"scope",
          depth:"mesh"
        },
        path:__dirname + "/2-module1",
        constructor:{
          type:"sync",
          parameters:[
            {value:{maximumPings:1000}}
          ]
        }
      },
      "module2":{
        scope:{
          variableName:"scope",
          depth:"api"
        },
        path:__dirname + "/2-module2",
        constructor:{
          type:"sync"
        }
      }
    },
    components: {
      "component1":{
        moduleName:"module1",
        startMethod:"start",
        schema:{
          "exclusive":false,//means we dont dynamically share anything else
          "methods":{
            "start":{
              type:"sync",
              parameters:[
               {"required":true, "value":{"message":"this is a start parameter"}}  
              ]
            }
          }
        }
      },
      "component2":{
        moduleName:"module2",
        schema:{
          "exclusive":false
        }
      }
  }
};

var mesh = Mesh();
mesh.start(config, function(err) {

  if (err) console.log(err.stack);

});






