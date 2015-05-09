module.exports = function(endpoint, componentName, action){

}

function Message(endpoint, componentName, action){
	var _this = this;

	_this.deliver = function(message, callback){
		console.log('delivering message');
		console.log(message);

		message.response = 'All good';
		callback(null, message)
	}
}