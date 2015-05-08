ipso = require('ipso');

describe('Mesh', function() {

    before(ipso(function(done, Mesh) {

        this.config = {

            

        };

        this.mesh = Mesh();
        this.mesh.initialize( this.config, function(err) { 

            done();

        });

    }));


    it('starts', ipso(function() {

        console.log(this.mesh);
        
    }));

});
