/**
 * Created by Johan on 4/14/2015.
 */

module.exports = function (appClient, options ) {
  return new Component2(appClient, options);
};

function Component2(appClient, options) {

  var valueStoreComponent = options.valueStore;
  // subscribe to component1
  appClient.dataMeshClient.on(valueStoreComponent + '/runTimeValue', 'PUT', 1, runTimeValueHandler);
  
  appClient.PUT(valueStoreComponent+'/runTimeValue', 5, function (err, result) {
    
  });
  
  function runTimeValueHandler(e, message) {
    if (message.path != valueStoreComponent + '/runTimeValue') { return throw ('Only runTimeValue is allowed')}
    
    appClient.set('runTimeValueReceived', message.data);
  }
  
  this.defaultDataHandler = function(e, message) {
    // subscription updates arrive here
    if (message.path == valueStoreComponent+'/value') {
      appClient.set('valueReceived', message.data);
    }
  };
  
  this.shutdown = function () {
    
  }.bind(this);
}
