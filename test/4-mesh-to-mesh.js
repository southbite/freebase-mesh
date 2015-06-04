// cannot do mocha test/4-mesh-to-mesh.js --watch
// address already in use for 2nd... runs

var maximumPings = 1000;

var Mesh = require('../lib/system/mesh');

mesh1 = Mesh();
mesh2 = Mesh();

config1 = {
  name: 'mesh1',
  port: 3001,
  dataLayer: {
    authTokenSecret: 'a256a2fd43bf441483c5177fc85fd9d3',
    systemSecret: 'mesh',
    log_level: 'info|error|warning'
  },
  endpoints: {
    /* TODO Race condition on miltiple mesh startup and connect to each other
     *      need a retry loop in the endpoint connect
     */
  },
  modules: {
    "module1":{
      path:__dirname + "/4-module1",
      constructor:{
        type:"sync",
        parameters:[]
      }
    },
    "freebaseUI":{
      path:"freebase-ui-module",
      constructor:{
        type:"sync",
        context:"new"//instantiate as a new one
        // parameters:[]
      }
    }
  },
  components: {
    "component1":{
      moduleName:"module1",
      // scope:"component",
      // startMethod:"start",
      schema:{
        "exclusive":false,//means we dont dynamically share anything else
        "methods":{
          "thanksYou": {
            parameters: [
              {name:'arg1',required:true},
              {name:'arg1',required:true},
              {name:'callback', type:'callback', required:true}
            ]
          }
        }
      }
    },
    "freebaseUI":{
      moduleName:"freebaseUI",
      // startMethod:"start",
      scope:"module",
      config:{},
      schema:{
        "exclusive":false,//means we dont dynamically share anything else
        "methods":{
          // start: {
          //   type: 'async',
          //   parameters: [
          //     //{"required":true, "value":{"freebase-system-secret":"mesh","freebase-port":3001}}
          //   ]
          // }
        }
      }
    }
  }
};

config2 = {
  name: 'mesh2',
  port: 3002,
  dataLayer: {
    authTokenSecret: 'a256a2fd43bf441483c5177fc85fd9d3',
    systemSecret: 'mesh',
    log_level: 'info|error|warning'
  },
  endpoints: {
    mesh1: {
      config: {
        port: 3001,
        secret: 'mesh',
        host: 'localhost' // TODO This was necessary, did not default
      }
    }
  },
  modules: {},
  components: {}
};

describe('Mesh to Mesh', function() {

  before(function(done) {

    mesh1.initialize(config1, function(err) {
      if (err) return done(err);
      // mesh1.start(function(err) {
      //   console.log(err);
      // });

      mesh1.api.exchange.freebaseUI.start({"freebase-system-secret":"mesh","freebase-port":3001}, function(err) {
        if (err) return done(err);
      });

      // mesh2.initialize(config2, function(err) {
      //   if (err) return done(err);
      //   done();
      // });

    });
  });

  after(function(done) {
    // TODO shut down mesh ability
    done();
  })

  it('',function(done) {
    this.timeout(200000000);


    // done();
  });




});
