/**
 * Created by Johan on 4/14/2015.
 * Updated by S.Bishop 6/1/2015.
 */

var moment = require('moment');

module.exports = function (options) {
  return new Component1(options);
};

function Component1(options) {

  var _this = this;

  if (!options)
    options = {};

   if (!options.maximumPings)
    options.maximumPings = 100;

  _this.exposedMethod = function(message, callback){

    try{

      console.log("Message from " + message.message);
      message.pingCount++;
      message.message = "Component1";
     //_this.scope.api.events.component2.exposedMethod(function(e, response)
      if (message.pingCount < options.maximumPings)
      _this.scope.api.exchange.component2.exposedMethod(message, function(e, response){
        
      });
      else{
         var timeDiff = moment.utc() - message.timestamp;
        console.log('Hooray, component ping pong test is over!! ' + message.pingCount + ' pings, elapsed time:' + timeDiff + 'ms');
      }
        

    }catch(e){
      callback(e);
    }
  }

  _this.start = function(){

    if (!_this.scope || !_this.scope.api)
      throw new Error('This component needs mesh level scope');

    _this.scope.api.exchange.component2.exposedMethod({message:"Component1", "timestamp":moment.utc(), "pingCount":0}, function(e, response){
        if (e) return console.log('call to component2 broke...' + e);

    });
  }

  _this.stop = function(){

  }
}
