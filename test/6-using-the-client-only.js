describe('Using the clientside only', function() {

  var spawn = require('child_process').spawn;
  var sep = require('path').sep;
  var remote;
  var assert = require('assert');

  // Spawn mesh in another process.
  before(function(done) {
    remote = spawn('node',[__dirname + sep + '4-first-mesh']);
    remote.stdout.on('data', function(data) {
      // console.log(data.toString());
      if (!data.toString().match(/READY/)) return;
      done();
    });
  });
  after(function(done) {
    remote.kill();
    done();
  })

  context('with clientside bits', function() {

    it('can ride the slippery slip', function(done) {
      
      var freebase = require('freebase');
     
      var MeshClient = require('../lib/system/api');

      MeshClient('localhost', 3001, 'mesh', function(err, client) {

        if (err) return done(err);

        client.api.exchange

        .theFarawayTree.moonface.rideTheSlipperySlip(
          
          'one!', 'two!', 'three!', function(err, res) {
          
            if (err) return done(err);
            assert(res == 'one! two! three!, wheeeeeeeeeeeeheeee!');
            done();

          }
        );
      });

    });
  })
});
