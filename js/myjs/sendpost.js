
var request = require("request");

var sendPost = function(value){

	request({
		method: "POST",
		uri: "https://io.adafruit.com/api/v2/vvphat/feeds/onoff/data",
		headers: {
			"X-AIO-Key": "20362ca9413947a5a41de99394e3b202",
			"Content-Type": "application/json" ,
		},
		json: true,
		body:{
			"datum":{"value":value}
		}
	}, function (error, response, body){
		if(!error && response.statusCode == 200){
			console.log(body);
		}
	});

};

var test = function(){
	console.log("aaaaaaaaaaa");
};
module.exports = test;