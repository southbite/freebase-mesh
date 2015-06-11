var async = require("async");
var serveStatic = require('serve-static');
var path = require("path");

module.exports = function (options) {
  return new Middleware(options);
};

function Middleware(options) {

  var _this = this;

  if (!options)
    options = {};

  if (!options.plugins)
    options.plugins = {};

  options.plugins.api = {
    name:"Mesh browser client",
    key:"api",
    description:"",
    image:null,
    entryPoint: "system:api",
    options:{},
    staticFolder:"app"
  }

  options.plugins.dashboard = {
    name:"Mesh dashboard",
    key:"dashboard",
    description:"",
    image:null,
    entryPoint: "system:dashboard",
    options:{},
    staticFolder:"app"
  }

  _this.attachedPlugins = {};
  _this.attachedPluginsDescription = {};

  _this.options = options;

  _this.start = function(done){

    if (!this.mesh)
      throw new Error('This module needs component level scope');

    async.eachSeries(Object.keys(_this.options.plugins), function(pluginName, eachCallback){

      try{
        var pluginConfig = _this.options.plugins[pluginName];
        var pluginEntryPoint = pluginConfig.entryPoint?pluginConfig.entryPoint:pluginName;

        if (pluginEntryPoint.indexOf('system:') == 0){
          var pathParts = pluginEntryPoint.split(':');
          pluginEntryPoint = '../plugins/' + pathParts[1] + '/plugin';
        }

        var pluginModule = require(pluginEntryPoint);
        var pluginInstance = pluginModule.apply(pluginModule);

        var attachPlugin = function(){
          try{
            
            this.mesh.data.context.connect.use("/mesh/plugins/" + pluginConfig.key, pluginInstance.handleRequest.bind(pluginInstance));

            if (pluginConfig.staticFolder){
              var staticPath = path.dirname(require.resolve(pluginEntryPoint)) + '/' + pluginConfig.staticFolder;
              console.log('static path is ' + staticPath);
              this.mesh.data.context.connect.use('/mesh/plugins/' + pluginConfig.key + '/' + pluginConfig.staticFolder, serveStatic(staticPath));
            }
            
            _this.attachedPlugins[pluginConfig.key] = pluginInstance;
            _this.attachedPluginsDescription[pluginConfig.key] = pluginConfig;

            eachCallback();
          }catch(e){
            this.mesh.util.log('Unable to attach plugin ' + pluginConfig.name + ' ' + e);
            eachCallback(e);
          }
        }.bind(this);

        if (pluginInstance.initialize){
          pluginInstance.initialize(pluginConfig.options, function(e){
            if (e)
              eachCallback(e);
            else
              attachPlugin();
          });
        }else
          attachPlugin();
  
      }catch(e){
        eachCallback(e);
      }
    }.bind(this), function(e){
        console.log('we are now done');

        if (e)
          return done(e);

        this.emit('plugins-loaded', _this.attachedPluginsDescription, function(e, response){

        });
    }.bind(this));

  }

  this.stop = function(){

  }
}
