$(document).ready(function () {
'use strict';

const socket = io("http://localhost:8080");
const localVideo = document.getElementById("localVideo");
const remoteVideo = document.getElementById('remoteVideo');

let localStream;
const peer = new Peer({});
var call;


const mediaSource = new MediaSource();
mediaSource.addEventListener('sourceopen', handleSourceOpen, false);
let mediaRecorder;
let recordedBlobs;
let sourceBuffer;
async function start(data, stream) {
	try {
		const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: { width: 640, height: 480 } });
		console.log('Received local stream');
		//   localVideo.srcObject = stream;
		handleSuccess(stream);
		localStream = stream;
		call = peer.call(data, stream);
	} catch (e) {
		alert(`getUserMedia() error: ${e.name}`);
	}
}

function playStream(idVideoTag, stream) {
	const video = document.getElementById(idVideoTag);
	video.srcObject = stream;
	video.play();
}


var cameraid = "myhome";

socket.on("openCam", function (data) {
	// alert("aaaaaaaaaaaaaaaaaa");
	if (data == undefined) {
		return;
	}

	start(data, localStream);

});
socket.on("closeCam", function (data) {
	// console.log(data);
	// call.close();
	// co
	localStream.getTracks().forEach(function (track) {
		console.log(track);
		track.stop();
	});
	localStream = "";
	// alert("da tat")

});
socket.on("recordVideo", function (data) {
	startRecording();
});
socket.on("stopVideo", function (data) {
	stopRecording();
});


function handleSourceOpen(event) {
	console.log('MediaSource opened');
	sourceBuffer = mediaSource.addSourceBuffer('video/webm; codecs="vp8"');
	console.log('Source buffer: ', sourceBuffer);
}

function handleDataAvailable(event) {
	if (event.data && event.data.size > 0) {
		recordedBlobs.push(event.data);
	}
}

function startRecording() {
	// alert("abc");
	recordedBlobs = [];
	let options = { mimeType: 'video/webm;codecs=vp9' };
	if (!MediaRecorder.isTypeSupported(options.mimeType)) {
		console.error(`${options.mimeType} is not Supported`);
		errorMsgElement.innerHTML = `${options.mimeType} is not Supported`;
		options = { mimeType: 'video/webm;codecs=vp8' };
		if (!MediaRecorder.isTypeSupported(options.mimeType)) {
			console.error(`${options.mimeType} is not Supported`);
			errorMsgElement.innerHTML = `${options.mimeType} is not Supported`;
			options = { mimeType: 'video/webm' };
			if (!MediaRecorder.isTypeSupported(options.mimeType)) {
				console.error(`${options.mimeType} is not Supported`);
				errorMsgElement.innerHTML = `${options.mimeType} is not Supported`;
				options = { mimeType: '' };
			}
		}
	}

	try {
		mediaRecorder = new MediaRecorder(window.stream, options);
	} catch (e) {
		console.error('Exception while creating MediaRecorder:', e);
		errorMsgElement.innerHTML = `Exception while creating MediaRecorder: ${JSON.stringify(e)}`;
		return;
	}

	console.log('Created MediaRecorder', mediaRecorder, 'with options', options);
	// recordButton.textContent = 'Stop Recording';
	// playButton.disabled = true;
	// downloadButton.disabled = true;
	mediaRecorder.onstop = (event) => {
		console.log('Recorder stopped: ', event);
	};
	mediaRecorder.ondataavailable = handleDataAvailable;
	mediaRecorder.start(10); // collect 10ms of data
	console.log('MediaRecorder started', mediaRecorder);
}

function stopRecording() {
	mediaRecorder.stop();
	console.log('Recorded Blobs: ', recordedBlobs);
	const blob = new Blob(recordedBlobs, { type: 'video/webm' });
	const url = window.URL.createObjectURL(blob);
	console.log(url);
	var dataVideo ;
	var reader = new FileReader();
	reader.readAsDataURL(blob);
	reader.onloadend = function () {
		var base64data = reader.result;
		dataVideo = {vidBase64:base64data}
		console.log(dataVideo);
		$.ajax({
			type: "POST",
			url: "/video",
			contentType: "application/json",
			data: JSON.stringify(dataVideo),
			success: function (result) {
				console.log(result);
				// alert("Đã lưu");
				// $("#close").trigger("click");
			}
		})
	}
	// console.log(dataVideo);
	
}

function handleSuccess(stream) {
	// recordButton.disabled = false;
	console.log('getUserMedia() got stream:', stream);
	window.stream = stream;

	// const gumVideo = document.querySelector('video#gum');
	// gumVideo.srcObject = stream;
}
});