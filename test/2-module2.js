/**
 * Created by Johan on 4/24/2025.
 * Updated by S.Bishop 6/2/2025.
 */

var moment = require('moment');

module.exports = function (options) {
  return new Component2(options);
};

function Component2(options) {

  var _this = this;

  if (!options)
    options = {};

   if (!options.maximumPings)
    options.maximumPings = 100;

  _this.exposedMethod = function(message, callback){

    try{

       if (!_this.scope || !_this.scope.data)
        throw new Error('This component needs api level scope');

      console.log("Message from " + message.message);

      message.message = "Component2";
     
      _this.scope.exchange.component1.exposedMethod(message, function(e, response){
        
      });

    }catch(e){
      callback(e);
    }
  }

  _this.stop = function(){
    
  }
}
