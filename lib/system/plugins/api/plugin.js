var browserify = require('browserify'),
byline = require('byline');

module.exports = function () {
  return new Browser();
};

function Browser() {
	var _this = this;

	_this.cached = null;

	var path = require('path');
	var stream = require('stream')
	var liner = new stream.Transform( { objectMode: true } );

	liner._transform = function (chunk, encoding, done) {
	     var data = chunk.toString()
	     if (this._lastLineData) data = this._lastLineData + data 
	 
	     var lines = data.split('\n') 
	     this._lastLineData = lines.splice(lines.length-1,1)[0] 
	 
	     lines.forEach(this.push.bind(this));

	     done();
	}

	liner._flush = function (done) {
	     if (this._lastLineData) this.push(this._lastLineData)
	     this._lastLineData = null
	     done()
	}

	_this.handleRequest = function(req, res, next){
		// try{
			
		// 	res.setHeader("Content-Type", "application/javascript");

		// 	if (_this.cached == null){
		// 		var js = '';
		// 		var bundle_stream = browserify([path.resolve(__dirname, '../../api.js')]).ignore('request').bundle({standalone:'MeshAPI'});

		// 		bundle_stream.pipe(liner)
		// 		liner.on('readable', function () {
		// 		     var line
		// 		     while (line = liner.read()) {
		// 		          // do something with line
				       
		// 				if (line == '//BEGIN SERVER-SIDE ADAPTER - DO NOT REMOVE THIS COMMENT')
		// 					line = '/*';
		// 				else if (line == '//END SERVER-SIDE ADAPTER')
		// 					line = '*/';
		// 				else if (line == '/*BEGIN CLIENT-SIDE ADAPTER - DO NOT REMOVE THIS COMMENT' || line == '*///END CLIENT-SIDE ADAPTER')
		// 					line = '';

		// 				js += line + '\n';
		// 		     }
		// 		})

		// 		bundle_stream.on('end', function(){
		// 			_this.cached = js;
		// 			res.end(_this.cached);
		// 		});
		// 	}
		// 	else{
  //       		res.end(_this.cached);
		// 	}
		// }catch(e){
		// 	next(e);
		// }

		next();
	}
};