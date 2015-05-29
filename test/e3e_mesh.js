ipso = require('ipso');

describe('Mesh e2e test', function() {

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
          scope:{
            variableName:"scope",
            depth:"api" //can be local, api, mesh TODO
          },
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
      		},
          start:{//where we define a method that starts this module, ie. like for the emitter TODO

          },
          shutdown:{

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
    	//console.log(client);
    	//console.log(e);
    });
	*/


    console.log('instantiate');

    this.mesh = Mesh();
     console.log('initialize');
    this.mesh.initialize(this.config, function(err) {

      if (err) {
        console.log('failure in init')
        console.log(err.stack)
      };

      done();

    });

  }));

  it('starts a local mesh, with a single component that wraps the freebase client module and compares the response with a freebase client instantiated outside of the mesh', ipso(function(done) {

    var _this = this;

    //we require a 'real' freebase client
    new require('freebase')["client"]({config:{"host":"localhost", "port":8000, "secret":"mesh"}}, function(e, client){
      
      if (e)
          console.log('real client init failure');

      client.set('/mytest/678687', {"test":"test1"}, {}, function(e, directClientResponse){

        console.log('real client set response');
        console.log(directClientResponse);

        //calling a local component
        _this.mesh.api.exchange.freebaseClient.set('/mytest/678687', {"test":"test1"}, {}, function(e, response){
          console.log('response to _this.mesh.api.freebaseClient.set');
          console.log(response);

          response.payload.data.test.should.eql(directClientResponse.payload.data.test);

          if (e) 
            return done(e);

         //calling a local component as if it was on another mesh
         _this.mesh.api.exchange.testMesh.freebaseClient.set('/mytest/678687', {"test":"test1"}, {}, function(e, response){
            console.log('response to _this.mesh.api.testMesh.freebaseClient.set');
            console.log(response);

            response.payload.data.test.should.eql(directClientResponse.payload.data.test);

              if (e) return done(e);

            //doing the same call using a post to the api
            _this.mesh.api.post('/freebaseClient/set', '/mytest/678687', {"test":"test1"}, {}, function(e, response){
              console.log('response to  _this.mesh.api.post(\'/freebaseClient/set');
              console.log(response);

              response.payload.data.test.should.eql(directClientResponse.payload.data.test);
              //console.log({response: response});
              //test aliases
               _this.mesh.api.exchange.testMesh.freebaseClient.PUT('/mytest/678687', {"test":"test1"}, {}, function(e, response){

                 response.payload.data.test.should.eql(directClientResponse.payload.data.test);

                 return done(e);
               });
            });
          });
        });
      });     
    });
  }));

  it('should expose a data layer that is a freebase client, local to the mesh', function (done) {

    var _this = this;

    _this.mesh.api.data.on('/mytest/datalayer/test', {event_type:'set', count:1}, function (e, message) {
      message.data.value.should.eql(10);
      done();
    }, function(e){
      if (e) done(e);
      _this.mesh.api.exchange.freebaseClient.set('/mytest/datalayer/test', {"value":10}, {}, function(e, response){
        if (e) done(e);
      });
    });
  });


});
