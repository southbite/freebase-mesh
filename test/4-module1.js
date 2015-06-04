module.exports = function() {

  return new Module1();

}

 function Module1(opts) {

  this.thanksYou = function(arg1, arg2, callback) {
    console.log({args:arguments});
    callback(null, 'thanks!');
  }

}