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
      var config = {
        endpoints: {
          theFarawayTree: {  // remote mesh node
            config: {
              port: 3001,
              secret: 'mesh',
              host: 'localhost' // TODO This was necessary, did not default
            }
          }
        }
      }

      var MeshAPI = require('../lib/system/api');

      MeshAPI(config, function(err, client) {

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
