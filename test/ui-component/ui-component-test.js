var Mesh = require('freebase-mesh');

var config = {
      name:"testMesh",
      dataLayer: {
        authTokenSecret: 'a256a2fd43bf441483c5177fc85fd9d3',
        systemSecret: 'mesh',
        log_level: 'info|error|warning'
      },
      endpoints: {},
      modules: {
      	"freebaseUI":{
          scope:"api", //can be local, api, mesh TODO
      	  path:"freebase-ui-module",
      	  constructor:{
            type:"sync",
            context:"new"//instantiate as a new one
          }
      	}
      },
      components: {
      	"freebaseUI":{
      		moduleName:"freebaseUI",
      		config:{},
      		schema:{
      			"exclusive":false,//means we dont dynamically share anything else
      			"methods":{}
      		}
      	}
    }
};

var mesh = Mesh();
mesh.initialize(config, function(err) {

  if (err) console.log(err.stack);

  console.log('doing start');

  //when using an unexclusive schema, we can dynamically call any functions the component instance shares.
  mesh.api.exchange.freebaseUI.start({"freebase-system-secret":"mesh"}, function(err){

  	if (err) console.log(err.stack);

  	console.log('ui component started');

  });

});



