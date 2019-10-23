const mongoose = require("mongoose");

var timerSchema = new  mongoose.Schema({
	hours: {
		type: Number
	},
	minutes: {
		type: Number
	},
	topic: {
		type: String
	},
	name:{
		type: String
	},
	value: {
		type: String
	},
	dayOfWeed: {
		type: Array
	},
	state:{
		type: Number
	}
});

mongoose.model("Timer",timerSchema);