/* Magic Mirror
 * Server
 *
 * By Michael Teeuw http://michaelteeuw.nl
 * MIT Licensed.
 */
require("../models/db");
var express = require("express");
var app = require("express")();
var server = require("http").Server(app);
var io = require("socket.io")(server);
var path = require("path");
var ipfilter = require("express-ipfilter").IpFilter;
var fs = require("fs");
var helmet = require("helmet");
var Utils = require(__dirname + "/utils.js");
var request = require("request");
var bodyParser = require("body-parser");
var moment = require("moment");
// var cv = require("opencv4nodejs");
var mqtt = require("mqtt");
const mongoose = require("mongoose");
const Timer = mongoose.model("Timer");
const Notifycation = mongoose.model("Notifycation");
// const wCap = new cv.VideoCapture(0);
var Server = function (config, callback) {

	var port = config.port;
	if (process.env.MM_PORT) {
		port = process.env.MM_PORT;
	}
	var dataAdafruit;
	var topic = "vvphat/feeds/";

	// app.use("/employee", employeeController);
	var getdata = function () {

		var url = "https://io.adafruit.com/api/v2/vvphat/feeds/";
		request({
			method: "GET",
			uri: url,
			headers: {
				"X-AIO-Key": "20362ca9413947a5a41de99394e3b202",
				"Content-Type": "application/json",
			},
			json: true,
		}, function (error, response, body) {
			if (!error && response.statusCode == 200) {
				// console.log(body);
				dataAdafruit = body;

			} else {
				console.log(error);
			}
		});
		return dataAdafruit;
	};
	dataAdafruit = getdata();
	console.log("Starting server on port " + port + " ... ");

	server.listen(port, config.address ? config.address : null);
	if (config.ipWhitelist instanceof Array && config.ipWhitelist.length === 0) {
		console.info(Utils.colors.warn("You're using a full whitelist configuration to allow for all IPs"));
	}

	app.use(function (req, res, next) {
		var result = ipfilter(config.ipWhitelist, { mode: config.ipWhitelist.length === 0 ? "deny" : "allow", log: false })(req, res, function (err) {
			if (err === undefined) {
				return next();
			}
			console.log(err.message);
			res.status(403).send("This device is not allowed to access your mirror. <br> Please check your config.js or config.js.sample to change this.");
		});
	});
	app.use(helmet());

	var jsonParser = bodyParser.json();

	app.use("/js", express.static(__dirname));
	var directories = ["/config", "/css", "/fonts", "/modules", "/vendor", "/translations", "/tests/configs"];
	var directory;
	for (var i in directories) {
		directory = directories[i];
		app.use(directory, express.static(path.resolve(global.root_path + directory)));
	}

	app.get("/version", function (req, res) {
		res.send(global.version);
	});

	app.get("/config", function (req, res) {
		res.send(config);
	});

	app.get("/", function (req, res) {
		var html = fs.readFileSync(path.resolve(global.root_path + "/index.html"), { encoding: "utf8" });
		html = html.replace("#VERSION#", global.version);

		configFile = "config/config.js";
		if (typeof (global.configuration_file) !== "undefined") {
			configFile = global.configuration_file;
		}
		html = html.replace("#CONFIG_FILE#", configFile);
		res.send(html);
	});
	app.get("/myhome", function (req, res) {
		var url = "https://io.adafruit.com/api/v2/vvphat/feeds/";
		request({
			method: "GET",
			uri: url,
			headers: {
				"X-AIO-Key": "20362ca9413947a5a41de99394e3b202",
				"Content-Type": "application/json",
			},
			json: true,
		}, function (error, response, body) {
			if (!error && response.statusCode == 200) {
				var allData = [];
				body.forEach(element => {
					var feed = {
						type: element.group.key,
						topic: element.key,
						value: element.last_value,
						name: element.name,
						icon: element.description
					};
					allData.push(feed);
					client.subscribe("vvphat/feeds/" + element.key);
				});

				io.emit("allData", allData);
				console.log(allData);
				loadTimer();
				loadNotifycation();
			} else {
				console.log(error);
			}
		});
		// abc.forEach(element => {
		// 	console.log(element.name+ " - "+ element.last_value);
		// });

		// io.emit("allData",abc);
		// Timer.find((err, docs) => {
		// 	if (!err) {
		// 		res.render(global.root_path + "/myhome.ejs", {
		// 			list: docs
		// 		});
		// 	}
		// 	else {
		// 		console.log("Error in retrieving employee list :" + err);
		// 	}
		// });
		res.render(global.root_path + "/myhome.ejs");
	});
	app.get("/test", function (req, res) {
		var url = "https://io.adafruit.com/api/v2/vvphat/feeds/";
		request({
			method: "GET",
			uri: url,
			headers: {
				"X-AIO-Key": "20362ca9413947a5a41de99394e3b202",
				"Content-Type": "application/json",
			},
			json: true,
		}, function (error, response, body) {
			if (!error && response.statusCode == 200) {
				// console.log(body);
				// io.emit("allData",body);
			} else {
				console.log(error);
			}
		});
		// set(()=>{
		// 	io.emit("image","dadada");
		// },1000);

		res.render(global.root_path + "/test.ejs", { "test": dataAdafruit });
	});

	var loadTimer = () => {
		Timer.find((err, docs) => {
			if (!err) {
				console.log(docs);
				io.emit("loadTimer", docs);
				return docs;
			}
			else {
				console.log("Error in retrieving list :" + err);
			}
		});

	};
	var loadNotifycation = () => {
		Notifycation.find().sort({ status:1, time:-1}).exec((err, docs) => {
			if (!err) {
				console.log(docs);
				io.emit("loadNotifycation", docs);
				return docs;
			}
			else {
				console.log("Error in retrieving list :" + err);
			}
		});

	};

	function insertNotifycation(value) {
		var notify = new Notifycation();
		notify.type = value.type;
		notify.time = value.time;
		notify.text = value.text;
		notify.status = value.status;
		notify.save((err, doc) => {
			if (!err) {
				loadNotifycation();
				// console.log(doc);
				// loadTimer();
			}
			else {
				console.log("Error during record insertion : " + err);
			}
		});
	}
	var options = {
		username: "vvphat",
		password: "20362ca9413947a5a41de99394e3b202"
	};
	var client = mqtt.connect("http://io.adafruit.com:1883", options);
	client.on("connect", function (connack) {
		// client.subscribe("");
		// client.subscribe("vvphat/feeds/den1",{rap:true});
		// console.log(client.getLastMessageId());
		console.log("MQTT connected");

		// client.subscribe("vvphat/feeds/onoff");
		// client.publish("vvphat/feeds/onoff","OFF");
	});
	// console.log(d);
	client.on("message", function (topic, message) {
		console.log(topic + " - " + message.toString());
		topic = topic.slice(13);
		io.emit("data", { topic: topic, message: message.toString() });
		if (topic == "hien-thi.cam-bien-mua" && message.toString() == "ON") {
			var type = topic;
			var time = new Date();
			var text = "Ngoài trời đang mưa. Xin anh Phát lưu ý!";
			var status = 0;
			var value = {
				type: type,
				time: time,
				text: text,
				status: status
			};
			insertNotifycation(value);
		}
	});
	// var abc = [{ hour: 21, min: 20 }, { hour: 21, min: 21 }, { hour: 21, min: 22 }, { hour: 21, min: 23 }];
	// setInterval(() => {

	// 	var now = moment();
	// 	abc.forEach(e => {
	// 		if (now.minutes() === e.min && now.hours() === e.hour) {
	// 			// console.log("aaaaaaaaavvvvv");
	// 		}
	// 	});
	// 	// console.log(now.hours());
	// 	//  console.log(now.minutes());
	// 	// now.seconds();
	// }, 1000);

	app.post("/myhome", jsonParser, (req, res) => {
		console.log(req.body);
		if (req.body._id == "") {
			console.log("add Timer post");
			insertTimer(req, res);
		}
		else {
			console.log("update Timer post");
			updateTimer(req.body._id, req.body);
			res.send("Updated timer	");
		}
	});
	app.post("/myhome/delete", jsonParser, (req, res) => {
		// console.log(req.body);
		console.log("Xóa Timer");
		Timer.findByIdAndRemove(req.body.id, (err, doc) => {
			if (!err) {
				// ??res.redirect('/employee/list');
				res.send("Đã xóa");
				loadTimer();
			}
			else { console.log("Error in Timer delete :" + err); }
		});

	});

	app.post("/myhome/deleteNotify", jsonParser, (req, res) => {
		// console.log(req.body);
		console.log("xóa thông báo");
		Notifycation.findByIdAndRemove(req.body.id, (err, doc) => {
			if (!err) {
				// ??res.redirect('/employee/list');
				res.send("Đã xóa");
				loadNotifycation();
			}
			else { console.log("Error in Timer delete :" + err); }
		});

	});

	app.get("/myhome/send", jsonParser, (req, res) => {
		// console.log(req.body);
		var text = { text: "Gửi tin nhắn" };
		sendMessenger(text);

	});
	app.get("/myhome/caichuong", jsonParser, (req, res) => {
		console.log("OOOOOOOOKKKKKKKMMMMMM");
		updateNotifycation();
		loadNotifycation();
		res.send("Ok đã xong");
	});
	// var sendMessenger = (text)=>{
	// 	var url = "https://vvphat-test.glitch.me/send";
	// 	request({
	// 		method: "POST",
	// 		uri: url,
	// 		json: true,
	// 		body: text,
	// 	}, function (error, response, body) {
	// 		if (!error && response.statusCode == 200) {
	// 			console.log(body);
	// 		} else {
	// 			console.log(error);
	// 		}
	// 	});
	// };
	app.post("/myhome/findone", jsonParser, (req, res) => {
		console.log(req.body);
		console.log("Find One Timer");
		Timer.findOne(req.body, (err, doc) => {
			if (!err) {
				// ??res.redirect('/employee/list');
				res.send(doc);
				// loadTimer();
			}
			else { console.log("Error in Timer :" + err); }
		});

	});
	app.post("/myhome/deleteAll", jsonParser, (req, res) => {
		// console.log(req.body);
		console.log("delete all nofity");
		Notifycation.remove((err, doc) => {
			if (!err) {
				// ??res.redirect('/employee/list');
				res.send("Đã xóa");
				loadNotifycation();
			}
			else { console.log("Error in DeleteNotify :" + err); }
		});

	});
	function insertTimer(req, res) {
		var timer = new Timer();
		timer.hours = req.body.hours;
		timer.minutes = req.body.minutes;
		timer.topic = req.body.topic;
		timer.value = req.body.value;
		timer.dayOfWeed = req.body.dayOfWeed;
		timer.state = req.body.state;
		timer.name = req.body.name;
		timer.save((err, doc) => {
			if (!err) {
				res.send("OK. insert thành công");
				// console.log(doc);
				loadTimer();
			}
			else {
				console.log("Error during record insertion : " + err);
			}
		});
	}

	app.post("/myhome/update", jsonParser, (req, res) => {
		var id = req.body.id;
		var data = req.body.data;
		console.log("Update Timer");
		updateTimer(id, data);
		res.send("Thành công CMNR");
	});

	function updateTimer(id, data) {
		Timer.findOneAndUpdate({ _id: id }, data, { new: true }, (err, doc) => {
			if (!err) {
				console.log("OKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKK");
				loadTimer();
			} else {
				console.log("Lỗi CMNR" + err);
			}
		});
	}
	function updateNotifycation(){
		Notifycation.update({status:0},{status:1},{multi:true},(err,docs)=>{
			if(!err){
				console.log("đã sửa");
			}else{
				console.log(err);
			}
		});
	}
	// setInterval(() => {
	// var allTimer = loadTimer();
	//console.log(allTimer);
	// var now = moment();
	// var now = moment();
	// allTimer.forEach(e => {
	// 	if(allTimer.state == 1){
	// 		if (now.hours() === e.hours && now.minutes() === e.minutes) {
	// 			console.log(e.topic);
	// 			if(dayOfWeed.length <= 0){
	// 				Timer.findOneAndUpdate({ _id: e._id }, state = 0, { new: true }, (err, doc) => {
	// 					if (!err) {
	// 						console.log("OK,");
	// 						;
	// 					}
	// 					else {
	// 						console.log("Error during record update : " + err);
	// 					}
	// 				});
	// 			}
	// 		}
	// 	}
	var oldMinute;
	setInterval(() => {
		Timer.find((err, docs) => {
			if (!err) {
				// console.log(docs);
				// io.emit("loadTimer",docs);
				var now = moment();
				docs.forEach(e => {
					if (e.state == 1) {
						if (now.hours() === e.hours && now.minutes() === e.minutes) {
							if (e.dayOfWeed.length <= 0) {
								client.publish(topic + e.topic, e.value);
								console.log(e.topic);
								updateTimer(e._id, { state: 0 });
							} else {
								if (oldMinute != now.minutes()) {
									console.log(e.topic);
									client.publish(topic + e.topic, e.value);
								}
							}
						}
					}
				});
				oldMinute = now.minutes();
			} else {
				console.log("Error in retrieving list :" + err);
			}
		});
	}, 2000);
	// Timer.find((err, docs) => {
	// 	if (!err) {
	// 		// console.log(docs);
	// 		// io.emit("loadTimer",docs);
	// 		var now = moment();
	// 		docs.forEach(e => {
	// 			if (e.state == 1) {
	// 				if (now.hours() === e.hours && now.minutes() === e.minutes) {
	// 					console.log(e.topic);
	// 				}
	// 			}
	// 		});
	// 	} else {
	// 		console.log("Error in retrieving list :" + err);
	// 	}
	// 	// });
	// }

	// } 2000);
	// socket.emit("Server-sent-data", "data");

	// // 	socket.on("disconnect", function()
	// // 	{
	// // 	});
	// // 	//server lắng nghe dữ liệu từ client
	// 	socket.on("Client-sent-data", function(data)
	// 	{
	// 		// 		//sau khi lắng nghe dữ liệu, server phát lại dữ liệu này đến các client khác
	// 		socket.emit("Server-sent-data", data);
	// 		console.log(data);
	// 	});
	// 	setInterval(function(){
	// 		var url = "https://io.adafruit.com/api/v2/vvphat/feeds/";
	// 		request({
	// 			method: "GET",
	// 			uri: url,
	// 			headers: {
	// 				"X-AIO-Key": "20362ca9413947a5a41de99394e3b202",
	// 				"Content-Type": "application/json",
	// 			},
	// 			json: true,
	// 		}, function (error, response, body) {
	// 			if (!error && response.statusCode == 200) {
	// 				// console.log(body);
	// 				socket.emit("load_data",body);
	// 			}else {
	// 				console.log(error);
	// 			}
	// 		});
	// 	},1000);
	// 	// socket.emit("Server-sent-data", "data");

	// app.post("/senddata", jsonParser, function (req, res) {
	// 	var data = req.body;
	// 	console.log(data);
	// 	client.publish(topic + data.name, data.value);
	// });
	io.on("connection", (socket) => {
		socket.on("sendData", (data) => {
			console.log(data);
			client.publish(topic + data.name, data.value);
		});
	});
	if (typeof callback === "function") {
		callback(app, io);
	}
};

module.exports = Server;