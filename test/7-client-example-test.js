describe('Client example', function() {

  var spawn = require('child_process').spawn;
  var sep = require('path').sep;
  var remote;
  var assert = require('assert');

  // Spawn mesh in another process.
  before(function(done) {
    remote = spawn('node',[__dirname + sep + '7-client-example-process.js']);
    remote.stdout.on('data', function(data) {
      console._stdout.write(data.toString());
      if (!data.toString().match(/READY/)) return;
      done();
    });
  });
  after(function(done) {
    remote.kill();
    done();
  })


  it('', function(done) {


    done();

  });

})