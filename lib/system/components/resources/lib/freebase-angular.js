(function(window, angular, undefined) {'use strict';
////console.log('registering freebase');

if (!FreebaseClient)
   throw 'Freebase browser client library not referenced';

angular.module('freebase', [])

.factory('freebaseClient', ['$window', function(wind) {
 return {
      connect:function(host, port, secret, done){
         var _this = this;
         
         new wind.FreebaseClient({config:{host:host, port:port, secret:secret}}, function(e, client){

            if (!e)
               _this.client = client;

            done(e);

         });
      }
   }
}])

})(window, window.angular);

