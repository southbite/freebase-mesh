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

      remoteEndpoints: {},

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
	      				"type":"async",
	      				"synonymn":"GET",
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
	      				"type":"async",
	      			    "synonymn":"PUT",
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
	      			"remove":{
	      				"type":"async",
	      				"synonymn":"DELETE",
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
    //console.log(this.mesh);

     this.mesh.api.post('/systemData/put', {path:'/mytest/678687', data:{"test":"test1"}}, function(e, response){

     	console.log(arguments);

     	if (e) return done(e);

     	this.mesh.api.post('/systemData/get', {path:'/mytest/678687'}, function(e, response){

     		console.log(arguments);

     		if (e) return done(e);

    	});
    });

    
  }));

});
