ipso = require('ipso');

describe('Mesh', function() {

  before(ipso(function(done, Mesh) {

    this.config = {

      name:"testMesh",

      dataLayer: {
        authTokenSecret: 'a256a2fd43bf441483c5177fc85fd9d3',
        systemSecret: 'mesh',
        log_level: 'info|error|warning'
      },

      endpoints: {},

      modules: {
      	"freebaseClient":{
      		path:"freebase",
      		constructor:{
      			type:"async",
      			name:"client",//if blank or null we just do new require
      			parameters:[
      				{"name":"config", "required":true, "value":{config:{"host":"127.0.0.1", "port":8000, "secret":"mesh"}}},
  					{"name":"callback", "parameterType":"callback"},    
      			],
      			callback:{
  					parameters:[
  						{"name":"error", "parameterType":"error"},
	  					{"name":"client", "parameterType":"instance"}
  					]
  				}
      		}
      	}
      },

      components: {
      	"freebaseClient":{
      		moduleName:"freebaseClient",
      		config:{

      		},
      		schema:{
      			"exclusive":true,//means we dont dynamically share anything else
      			"methods":{
      				"get":{
	      				"alias":"GET",
	      				"parameters":[
	      					{"name":"path", "required":true},
	      					{"name":"options"},
	      					{"name":"callback", "type":"callback", "required":true}
	      				],
	      				"callback":{
	      					"parameters":[
		  						{"name":"error", "type":"error"},
		  						{"name":"response"}
		  					]
	      				}
	      			},
	      			"set":{
	      			  "alias":"PUT",
	  				    "parameters":[
	  				   		{"name":"path", "required":true},
	  				   		{"name":"data", "required":true},
	  				   		{"name":"options"},
                  {"name":"callback", "type":"callback", "required":true}
	  				   		
	  				   	],
	      				"callback":{
	      					"parameters":[
		  						{"name":"error", "type":"error"},
		  						{"name":"response"}
		  					]
	      				}
	      			},
	      			"remove":{
	      				"alias":"DELETE",
	  				    "parameters":[
	  				    	{"name":"path", "required":true},
	  				    	{"name":"options"},
	  				    	{"name":"callback", "type":"callback", "required":true}
	  				    ],
	      				"callback":{
	      					"parameters":[
		  						{"name":"error", "type":"error"},
		  						{"name":"response"}
		  					]
	      				}
	      			}
	      		}
      		}
      	}
      },

    };

    /*
    new require('freebase')["client"]({config:{"host":"127.0.0.1", "port":8000, "secret":"mesh"}}, function(e, client){
    	console.log(client);
    	console.log(e);
    });
	*/


    this.mesh = Mesh();
    this.mesh.initialize( this.config, function(err) {

      if (err) console.log(err.stack);

      done();

    });

  }));


  it('starts', ipso(function(done) {

  	var _this = this;

    //console.log(this.mesh);
    //'/mytest/678687', {}, { test: 'test1' }, [Function]


  _this.mesh.api.freebaseClient.set('/mytest/678687', {"test":"test1"}, {}, function(e, response){
        console.log('arguments of response to _this.mesh.api.freebaseClient.set');
        console.log(arguments);

        if (e) return done(e);
  });
  



	_this.mesh.api.post('/freebaseClient/set', '/mytest/678687', {"test":"test1"}, {}, function(e, response){
     	
      console.log('arguments of response to _this.mesh.api.post');
     	console.log({error: e});
      console.log({response: response});
      
     	return done(e);
	});

   
     
    
  }));

});
