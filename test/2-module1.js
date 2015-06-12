/**
 * Created by Johan on 4/14/2015.
 * Updated by S.Bishop 6/1/2015.
 */

var moment = require('moment');

module.exports = function (options) {
  return new Component1(options);
};

function Component1(options) {

  if (!options)
    options = {};

   if (!options.maximumPings)
    options.maximumPings = 100;

  this.moduleMethod = function(){
    //console.log('ran the module method from the component level scope');
  }

  this.exposedMethod = function(message, callback){

    try{

      this.module.instance.moduleMethod();

      //console.log("Message from " + message.message);
      ////console.log(message);
      ////console.log(options);
      message.pingCount++;
      message.message = "Component1";


     //_this.scope.api.events.component2.exposedMethod(function(e, response)
      if (message.pingCount < options.maximumPings)
      this.mesh.exchange.component2.exposedMethod(message, function(e, response){
        callback(e);
      });
      else{
        var timeDiff = moment.utc() - message.timestamp;
        var message = 'Hooray, component ping pong test is over!! ' + message.pingCount + ' pings, elapsed time:' + timeDiff + 'ms';
        this.emit('maximum-pings-reached', message, function(e, response){

          ////console.log('emit results');
          ////console.log(arguments);

        });
      }
        
    }catch(e){
      callback(e);
    }
  }

  this.start = function(){

    //console.log('starting module1 component');

    if (!this.mesh)
      throw new Error('This module needs component level scope');

    this.mesh.exchange.component2.exposedMethod({message:"Component1", "timestamp":moment.utc(), "pingCount":0}, function(e, response){
        if (e) return //console.log('call to component2 broke...' + e);

    });
  }

  this.stop = function(){

  }
}
