/**
 * Created by Johan on 4/14/2015.
 */

module.exports = function (appClient, options) {
  return new Component1(appClient, options);
};

function Component1(appClient, options) {

  // 3rd Parameter is permissions
  appClient.registerAPI.PUT('value', valuePUT, {});
  appClient.registerAPI.GET('value', valueGET, {});

  function valuePUT(params, callback) {
    appClient.set('value', params, function (err, result) {
      callback();
    });
  }

  function valueGET(params, callback) {
    appClient.get('value', function (err, result) {      
      if (err) return callback(err);
      
      callback(undefined, result);
    });
  }

  this.defaultDataHandler = function (event, callback) {
    // subscription updates arrive here
  };

  this.shutdown = function () {

  }.bind(this);
}
