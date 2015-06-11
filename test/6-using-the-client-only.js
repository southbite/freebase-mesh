describe('Using the clientside only', function() {

  var spawn = require('child_process').spawn;
  var sep = require('path').sep;
  var remote;

  // Spawn mesh in another process.
  before(function(done) {
    remote = spawn('node',[__dirname + sep + '4-first-mesh']);
    remote.stdout.on('data', function(data) {
      if (!data.toString().match(/READY/)) return;
      done();
    });
  });
  after(function(done) {
    remote.kill();
    done();
  })

  context('with clientside bits', function() {


    it('', function(done) {
      
      var freebase = require('freebase');
      var api = require('../../lib/ststem/api');

      api.initialize(config, freebase, function(err, api) {

      })



    });
  })
});