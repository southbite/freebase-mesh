// Executable from the command line
// Config file name passed in command line parameters

var express = require('express');

module.exports = function(configFile) {
  return new SmcAppEngine(configFile);
};

function SmcAppEngine (configFile) {
  
  var config = require(configFile);
  
  var componentInstances = [];
  
  // create an express server that will route both API calls 
  // And data-mesh access calls like read?
  // todo: Not sure we want to expose this, but keeping for discussion
  var expressServer = express();
    
  // create an API broker than will be passed requests from internal and the express server
  var apiBroker = require('smc-api-broker')(expressServer);
  
  // Do the Data Mesh stuff
  this.dataMeshClient = {};
  
  // Do the component orchestration
  _.forOwn(config.orchestration, function (instanceDescription) {
    var appClient = require('./lib/app_client.js')(instanceDescription.instanceName, this.dataMeshClient, apiBroker);
    var componentInstance = require(instanceDescription.module)(appClient, instanceDescription);
    // do all the rest    
    componentInstances.push(componentInstance);
    
    // do the subscribe in the orchestration which will be handled by component default handler
    
  }, this);
  
  this.shutdown = function (){
    // kill all components
    componentInstances.forEach(function(instance) {
      instance.shutdown();
    });
    
    this.expressServer.close();
    // kill the data mesh
    
  }.bind(this);
  
  
  this.expressServer.listen(80);
}