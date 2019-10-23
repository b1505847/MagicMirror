const mongoose = require("mongoose");

var notifySchema = new  mongoose.Schema({
	type:{
		type: String
	},
	time: {
		type: Date
	},
	text:{
		type: String
	},
	status: {
		type: Number
	},
});

mongoose.model("Notifycation",notifySchema);