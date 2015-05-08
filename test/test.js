/**
 * Created by Johan on 4/14/2015.
 */

var should = require('chai').should();
var appEngine = require('../index.js');
var http = require('http');

describe('smc_app_engine', function () {

  // This test has 2 components:
  //   - component 1: Has an API to inc a counter in the data mesh by the number in the counter
  //   - component 2: Subscribes to the count and sets a last contReceived variable in the data mesh
  //                  Increments the count in component 1 by 5 on startup.

  var engine;

  beforeEach(function (done) {
    engine = appEngine('./test/test1_config', done);
  });

  afterEach(function (done) {
    engine.close(done);
    delete(engine);
  });

  it('should instantiate a component with an API', function (done) {
    // wait for component2 to do its logic
    // write to component 1 count which will trigger subs in component 2.
    // Component 2 will then set runTimeValueReceived.
    setTimeout(function () {
      appEngine.dataMeshClient.get("Component2Instance/runTimeValueReceived", function (e, results) {
        results.payload.should.eql(5);
        done();
      });
    }, 200);

  });

  it.skip('should make API restful', function (done) {

    engine.dataMeshClient.on('Component1Instance/count', 'PUT', 1, function (e, message) {
      message.payload.should.eql(10);
      done();
    });

    http.POST('http://localhost/Component1Instance/inc_count', {param1: 10});

  });

  it('should call the default data handlers for a subscription with no handler', function (done) {

    // The first call in component 2 will make value 5 and use the single subscription in component 2.
    // The next call will use the default subscription

    engine.dataMeshClient.on('Component2Instance/valueReceived', 'PUT', 1, function (e, message) {
      message.payload.should.eql(10);
      done();
    });

    engine.APIBroker.PUT('Component1Instance/value', 10, function (err, result) {
      should.not.exist(err);
    });

  });

});
