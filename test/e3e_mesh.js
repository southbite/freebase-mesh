ipso = require('ipso');

describe('Mesh', function() {

  before(ipso(function(done, Mesh) {

    this.config = {

      dataLayer: {
        authTokenSecret: 'a256a2fd43bf441483c5177fc85fd9d3',
        systemSecret: 'mesh',
        log_level: 'info|error|warning'
      },

      remoteEndpoints: {},

      modules: {},

      components: {

        emitter: {}

      },



    };

    this.mesh = Mesh();
    this.mesh.initialize( this.config, function(err) {

      if (err) console.log(err.stack);

      done();

    });

  }));


  it('starts', ipso(function() {

    //console.log(this.mesh);
        
  }));

});
