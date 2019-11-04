$(document).ready(function () {
	var socket = io("http://localhost:8080");
	var checkbox;
	var toggleTimer;
	var thongbao = 0;
	// Nút group button
	var checkToggleGroup = function (checkbox) {
		var numberOn = 0;
		for (var i = 0; i < checkbox.length; i++) {
			if ($(checkbox[i]).is(":checked")) {
				numberOn++;
				// alert(numberOn);
				$(checkbox[i]).parents(".row-toggle").addClass("turnOn");
			} else {
				$(checkbox[i]).parents(".row-toggle").removeClass("turnOn");
			}
		}
		if (numberOn > 0) {
			$("#buttonGroup").prop("checked", true);
		} else {
			$("#buttonGroup").prop("checked", false);
		}
	};
	var checkLoadTimer = function (toggleTimer) {
		for (var i = 0; i < toggleTimer.length; i++) {
			if ($(toggleTimer[i]).is(":checked")) {
				// alert(numberOn);
				$(toggleTimer[i]).parents(".row-timer").addClass("turnOn");
			} else {
				$(toggleTimer[i]).parents(".row-timer").removeClass("turnOn");
			}
		}
	};
	var checkLoadDisplay = function (data) {
		var id = data.topic;
		id = id.replace(".", "\\.");
		var val = data.message;
		$("#" + id).text(val);
	};
	// Nhận toàn dữ liệu
	socket.on("allData", function (data) {
		console.log(data);
		$(".thietbi").text("");
		$(".hienthi").text("");
		data.forEach(element => {
			if (element.type === "den" || element.type === "cong-tac") {
				var icon = element.icon;
				if (icon === null || icon === "") {
					if (element.type === "den") {
						icon = "fas fa-lightbulb";
					} else {
						icon = "fas fa-bolt";
					}
				}
				$(".thietbi").append("<div class=\"row row-toggle\" >" +
					"<div class=\"col-1 icon\">" +
					"<i class=\"" + icon + "\"></i>" +
					"</div>" +
					"<h4 class=\"small font-weight-bold col-11\">" + element.name + "<span class=\"float-right\">" +
					"<div class=\"custom-switch\">" +
					"<input type=\"checkbox\" class=\"custom-control-input toggle\" id=\"" + element.topic + "\">" +
					"<label class=\"custom-control-label\" for=\"" + element.topic + "\"></label>" +
					"</div>" +
					"</span>" +
					"</h4>" +
					"</div>");

				if (element.value === "ON") {
					$("#" + element.topic).prop("checked", true);
				} else {
					$("#" + element.topic).prop("checked", false);
				}
				$(".select-topic").append("<option value=\"" + element.topic + "\">" + element.name + "</option>");
			}
			if (element.type == "hien-thi") {
				$(".hienthi").append("<div class=\"col-xl-3 col-md-6 mb-4\">" +
					"<div class=\"card border-left-primary shadow h-100 py-2\">" +
					"<div class=\"card-body\">" +
					"<div class=\"row no-gutters align-items-center\">" +
					"<div class=\"col mr-2\">" +
					"<div class=\"text-xs font-weight-bold text-primary text-uppercase mb-1\">" +
					"" + element.name + "</div>" +
					"<div class=\"h5 mb-0 font-weight-bold text-gray-800\" id=\"" + element.topic + "\">" + element.value + "</div>" +
					"</div>" +
					"<div class=\"col-auto\">" +
					"<i class=\"" + element.icon + " fa-2x text-gray-300\"></i>" +
					"</div>" +
					"</div>" +
					"</div>" +
					"</div>" +
					"</div>");
			}
		});
		// nút cong tắc
		checkbox = $(".toggle");
		$(checkbox).click(function () {
			var key = $(this).closest(".toggle").attr("id");
			console.log(key);
			if ($(this).is(":checked")) {
				sendData(key, "ON");
			} else {
				sendData(key, "OFF");
			}
			checkToggleGroup(checkbox);
		});
		//nút tổng
		checkToggleGroup(checkbox);
		$("#buttonGroup").click(function () {
			var cat, dog;
			if ($("#buttonGroup").is(":checked")) {
				cat = "ON";
				dog = true;
			} else {
				cat = "OFF";
				dog = false;
			}
			for (var i = 0; i < checkbox.length; i++) {
				var key = $(checkbox[i]).closest(".toggle").attr("id");
				sendData(key, cat);
				$(checkbox[i]).prop("checked", dog);
			};
		});

	});

	// Save event

	var checkAgain = $(".form-check-input");
	$("#save").click(function () {
		var hours = $("select[name=hour]").val();
		var mins = $("select[name=minute]").val();
		var topic = $("select[name=select-topic]").val();
		var state = $("select[name=state]").val();
		var again = [];
		var _id = $("#_id").val();
		var name = $("select[name=select-topic]").find(":selected").text();
		var status = 1;
		// alert(name);
		for (var i = 0; i <= checkAgain.length; i++) {
			// var key = $(checkAgain[i]).closest(".form-check-input").attr("id");
			if ($(checkAgain[i]).is(":checked")) {
				var val = $(checkAgain[i]).val();
				again.push(val);
			}
		};
		var data = {
			hours: hours,
			minutes: mins,
			topic: topic,
			value: state,
			dayOfWeed: again,
			_id: _id,
			name: name,
			state: status
		};
		// alert(hour+"-"+ min +"-"+topic+" - "+state);
		// console.log(again);
		$.ajax({
			url: "myhome",
			type: "post",
			contentType: "application/json",
			data: JSON.stringify(data),
			success: function (result) {
				console.log(result);
				alert("Đã lưu");
				$("#close").trigger("click");
			}
		});

	});

	//Send data
	var sendData = function (name, value) {
		var data = {
			name: name,
			value: value
		};
		socket.emit("sendData", data);
	};
	//Nhận data
	socket.on("data", function (data) {
		console.log(data);
		for (var i = 0; i < checkbox.length; i++) {
			var key = $(checkbox[i]).closest(".toggle").attr("id");
			if (key === data.topic) {
				if (data.message === "ON") {
					$(checkbox[i]).prop("checked", true);
				} else {
					$(checkbox[i]).prop("checked", false);
				}
				break;
			}
		}
		checkToggleGroup(checkbox);
		checkLoadDisplay(data);
	});

	//Hẹn giờ
	socket.on("loadTimer", function (data) {
		console.log(data);
		$(".hengio").text("");
		data.forEach(element => {
			var hour = element.hours;
			if (hour < 10) {
				hour = "0" + hour;
			}
			var min = element.minutes;
			if (min < 10) {
				min = "0" + min;
			}
			var again = "";
			if (element.dayOfWeed.length <= 0) {
				again = "Không";
			} else if (element.dayOfWeed.length == 7) {
				again = "Mọi ngày";
			} else {
				element.dayOfWeed.forEach(day => {
					if (day == "0") {
						again = again + " Chủ Nhật";
					} else {
						day = parseInt(day) + 1;
						again = again + " Thứ " + day;
					}
				});
			}
			var check = "";
			if (element.state == 1) {
				check = "checked";
			}
			var val = "Tắt";
			if (element.value == "ON") {
				val = "Mở";
			}
			var name = element.name;
			$(".hengio").append("<div class=\"row-timer\">" +
				"<div>" +
				"<span style=\"font-size:50px\">" + hour + ":" + min + "</span> " + name + ": " + val + " <span class=\"float-right\">" +
				"<div class=\"custom-switch\">" +
				"<input type=\"checkbox\" class=\"custom-control-input toggleTimer\" id=\"" + element._id + "\" " + check + ">" +
				"<label class=\"custom-control-label\" for=\"" + element._id + "\"></label>" +
				"</div>" +
				"</span>" +
				"</div>" +
				"<div>" +
				"Lặp lại: " + again + "." +
				"<div class=\"btn-group float-right\">" +
				"<div class=\"btn btn-primary modifyTimer\" id=\"mod-" + element._id + "\"><i class=\"fas fa-edit\" style=\"color: #fff;\"></i></div>" +
				"<div class=\"btn btn-primary deleteTimer\" id=\"del-" + element._id + "\"><i class=\"fas fa-trash-alt\" style=\"color: #fff;\"></i></div>" +
				"</div>" +
				"</div>" +
				"</div>" +
				"<hr>"
			);

		});

		// Sữa hen giờ
		var modList = $(".modifyTimer");
		$(modList).click(function () {
			var id = $(this).closest(".modifyTimer").attr("id");
			id = id.slice(4);
			// console.log(id);
			// $("#addTimer").addClass("show");
			$("#add-button").trigger("click");
			$("#_id").val(id);
			$("#exampleModalLabel").text("Sửa hẹn giờ");
			$.ajax({
				url: "myhome/findone",
				type: "post",
				contentType: "application/json",
				data: JSON.stringify({ _id: id }),
				success: function (result) {
					console.log("load timer modify");
					$("select[name=hour]").val(result.hours);
					$("select[name=minute]").val(result.minutes);
					$("select[name=select-topic]").val(result.topic);
					$("select[name=state]").val(result.value);
					// alert("Đã xóa");
					// $("#close").trigger("click");
					if (result.dayOfWeed.length > 0) {
						result.dayOfWeed.forEach(function (element) {
							// console.log(element);
							if (element == 0) {
								$("#chunhat").prop("checked", true);
							} else {
								element = parseInt(element) + 1;
								$("#thu" + element).prop("checked", true);
							}
						});
					}
				}
			});
		});
		// xóa hẹn giờ
		var delList = $(".deleteTimer");
		$(delList).click(function () {
			var id = $(this).closest(".deleteTimer").attr("id");
			id = id.slice(4);
			console.log(id);
			$.ajax({
				url: "myhome/delete",
				type: "post",
				contentType: "application/json",
				data: JSON.stringify({ id: id }),
				success: function (result) {
					console.log(result);
					alert("Đã xóa");
					// $("#close").trigger("click");
				}
			});
		});
		// nút hẹn giờ
		toggleTimer = $(".toggleTimer");
		$(toggleTimer).click(function () {
			var key = $(this).closest(".toggleTimer").attr("id");
			console.log(key);
			var val;
			if ($(this).is(":checked")) {
				val = {
					id: key,
					data: { state: 1 }
				};
			} else {
				val = {
					id: key,
					data: { state: 0 }
				};
			}
			updateTimer(val);
			// checkLoadTimer(toggleTimer);
			// checkToggleGroup(checkbox);
		});
		// checkToggleDisplay(toggleTimer);
		checkLoadTimer(toggleTimer);
	});
	// sửa hẹn giờ

	socket.on("loadNotifycation", function (data) {
		console.log(data);
		$(".thongbao").text("");
		$(".notify").text("");
		var dem = 0;
		var check = 0;
		data.forEach((element, index) => {
			var temp = Date.parse(element.time);
			var dateTime = new Date(temp);
			var gio = dateTime.getHours();
			var phut = dateTime.getMinutes();
			var ngay = dateTime.getDate();
			var thang = dateTime.getMonth() + 1;
			var nam = dateTime.getFullYear();
			if (gio < 10) {
				gio = "0" + gio;
			}
			if (phut < 10) {
				phut = "0" + phut;
			}
			if (ngay < 10) {
				ngay = "0" + ngay;
			}
			if (thang < 10) {
				thang = "0" + thang;
			}
			var icon;
			if (element.type === "hien-thi.cam-bien-mua") {
				icon = "fas fa-cloud-rain";
			}
			var textDay = gio + ":" + phut + " " + ngay + "/" + thang + "/" + nam;
			var daDoc = "";
			if (element.status == 0) {
				dem++;
				daDoc = "font-weight-bold";
			} else {
				check++;
			}
			$(".notify").append("<a class=\"dropdown-item d-flex align-items-center \" >" +
				"<div class=\"mr-3\">" +
				"<div class=\"icon-circle bg-primary\">" +
				"<i class=\"" + icon + " text-white\"></i>" +
				"</div>" +
				"</div>" +
				"<div style=\"width:100%\">" +
				"<div class=\"small text-gray-500\">" + textDay + "</div>" +
				"<span class=\"" + daDoc + "\">" + element.text + "</span> " +
				"</div>" +
				"<div class=\"btn btn-primary float-right del-notify\" id=\"del-"+element._id+"\"><i class=\"fas fa-trash-alt\" style=\"color: #fff;\"></i></div>"+
				"</a>");
			if (check <= 3) {
				$(".thongbao").append("<a class=\"dropdown-item d-flex align-items-center\" href=\"#\">" +
					"<div class=\"mr-3\" id=\"" + element._id + "\">" +
					"<div class=\"icon-circle bg-primary\">" +
					"<i class=\"" + icon + " text-white\"></i>" +
					"</div>" +
					"</div>" +
					"<div>" +
					"<div class=\"small text-gray-500\">" + textDay + "</div>" +
					"<span class=\"" + daDoc + "\">" + element.text + "</span>" +
					"</div>" +
					"</a>");
			}

		});
		if (dem > 3) {
			$("#numberNotify").text("3+");
		} else if (dem == 0) {
			$("#numberNotify").text("");
		} else {
			$("#numberNotify").text(dem);
		}

		var delNotify = $(".del-notify");
		$(delNotify).click(function () {
			var id = $(this).closest(".del-notify").attr("id");
			id = id.slice(4);
			console.log(id);
			$.ajax({
				url: "myhome/deleteNotify",
				type: "post",
				contentType: "application/json",
				data: JSON.stringify({ id: id }),
				success: function (result) {
					console.log(result);
					// alert("Đã xóa");
					// $("#close").trigger("click");
				}
			});
		});
	});
	updateTimer = function (data) {
		$.ajax({
			url: "myhome/update",
			type: "post",
			contentType: "application/json",
			data: JSON.stringify(data),
			success: function (result) {
				console.log(result);
				// alert("Đã xóa");
				// $("#close").trigger("click");
			}
		});

	};
	$("#add-button").click(function () {
		$("#_id").val("");
		for (var i = 0; i <= checkAgain.length; i++) {
			$(checkAgain[i]).prop("checked", false);
		};
		$("#exampleModalLabel").text("Thêm hẹn giờ");
		var d = new Date();
		$("select[name=hour]").val(d.getHours());
		$("select[name=minute]").val(d.getMinutes()+1);
		$("select[name=select-topic]").prop("selectedIndex", 0);
		$("select[name=state]").prop("selectedIndex", 0);
	});

	$(".cai-chuong").on("hidden.bs.dropdown", function () {
		if (thongbao === 0) {
			loadCaiChuong();
		}
	});
	$("#allThongBao").click(function () {
		thongbao = 1;
	});
	$("#notification").on("hidden.bs.modal", function () {
		thongbao = 0;
		loadCaiChuong();
	});
	function loadCaiChuong() {
		$.ajax({
			url: "myhome/caichuong",
			type: "get",
			contentType: "application/json",
			success: function (result) {
				console.log(result);
				// alert("Đã xóa");
				// $("#close").trigger("click");
			}
		});
	}
	$("#delele-all").click(function(){
		// alert("aaaaaaaaaaaaa");
		$.ajax({
			url: "myhome/deleteALl",
			type: "post",
			contentType: "application/json",
			success: function (result) {
				console.log(result);
				// alert("Đã xóa");
				// $("#close").trigger("click");
			}
		});
	});
});