const mongoose = require("mongoose");

var notifycationSchema = new  mongoose.Schema({
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

mongoose.model("Notifycation",notifycationSchema);