var fname = '';
var flag = false;
var intervalTimer;
var previousBytesLoaded;
var bytesUploaded;
var bytesTotal;

function _id(id)
{
	return document.getElementById(id);
}

function parseFile(file)
{
	var reader = new FileReader();
	if(file.type.indexOf('image') == 0) {
		reader.onload = function(e) {
			$('#source-data').html('<p><b>' + fname + ':</b><br>' + '<img src="' +
				e.target.result + '" alt="Image" class="m-v-md img-responsive"></p>');
		};
		reader.readAsDataURL(file);
	}
	else if(file.type.indexOf('text') == 0) {
		reader.onload = function(e) {
			$('#source-data').html('<p><b>' + fname + ':</b></p><pre class="text-reponsive">' +
				e.target.result.replace(/</g, '&lt;').replace(/>/g, '&gt;') + '</pre>');
		};
		reader.readAsText(file);
	}
	else {
		$('#source-data').html('');
	}
}

function fileSelected()
{
	var file = _id('fileToUpload').files[0];
	var fileSize = 0;

	if (file.size >= 1000000) {
		fileSize = (Math.round(file.size / 10000) / 100).toString() + ' MB';
	}
	else if(file.size >= 1000) {
		fileSize = (Math.round(file.size / 10) / 100).toString() + ' KB';
	}
	else {
		fileSize = (file.size).toString() + ' B';
	}

	fname = file.name;
	var info = 'Tên: ' + fname + '<br>' +
		'Kích thước: ' + fileSize + '<br>' +
		'Kiểu tập tin: ' + file.type;
	$('#fileInfo').html(info);

	flag = file.size < 50000000;
	parseFile(file);
}

function updateProgress(val)
{
	var progessBar = $('#upload-progress');
	progessBar.css('width', val + '%');
	progessBar.attr('aria-valuenow', val);
	$('.progress-indicator').text(val + '%');
}

function uploadFile()
{
	if(flag) {
		flag = false;
		previousBytesLoaded = 0;

		$('#upload-response').html('');
		$('#transferBytesInfo').html('');
		$('#transferSpeedInfo').html('');
		$('#timeRemainingInfo').html('');

		updateProgress(0);
		$('#progressBar').show();

		var form = _id('form');
		var fd = new FormData(form);
		$('#form').find(':input').prop('disabled', true);
		form.reset();

		var xhr = new XMLHttpRequest();
		xhr.upload.addEventListener('progress', uploadProgress, false);
		xhr.addEventListener('load', uploadSuccess, false);
		xhr.addEventListener('error', uploadFailed, false);
		xhr.addEventListener('loadend', uploadComplete, false);
		xhr.addEventListener('abort', uploadCanceled, false);
		xhr.open('POST', '/');
		xhr.send(fd);

		intervalTimer = setInterval(updateTransferSpeed, 500);
	}
	else {
		alert('Không tìm thấy file hoặc kích thước file lớn hơn 50 MB');
	}
}

function uploadProgress(evt) {
	/** @namespace evt.lengthComputable */
	if (evt.lengthComputable) {
		/** @namespace evt.loaded */
		bytesUploaded = evt.loaded;
		/** @namespace evt.total */
		bytesTotal = evt.total;
		var percentComplete = Math.round(bytesUploaded * 100 / bytesTotal);
		var bytesTransfered = '';

		if (bytesUploaded >= 1000000) {
			bytesTransfered = (Math.round(bytesUploaded / 10000) / 100).toString() + ' MB';
		}
		else if (bytesUploaded >= 1000) {
			bytesTransfered = (Math.round(bytesUploaded / 10) / 100).toString() + ' KB';
		}
		else {
			bytesTransfered = (Math.round(bytesUploaded)).toString() + ' B';
		}

		updateProgress(percentComplete);
		$('#transferBytesInfo').html('Đã upload: ' + bytesTransfered);
	}
}

function updateTransferSpeed() {
	var currentBytes = bytesUploaded;
	var bytesDiff = currentBytes - previousBytesLoaded;

	if (bytesDiff == 0) {
		return;
	}

	previousBytesLoaded = currentBytes;
	bytesDiff = bytesDiff * 2;
	var bytesRemaining = bytesTotal - previousBytesLoaded;
	var secondsRemaining = Math.round(bytesRemaining / bytesDiff);
	var speed = '';

	if (bytesDiff >= 1000000) {
		speed = (Math.round(bytesDiff / 10000) / 100).toString() + ' MB/s';
	}
	else if (bytesDiff >= 1000) {
		speed =  (Math.round(bytesDiff / 10) / 100).toString() + ' KB/s';
	}
	else {
		speed = bytesDiff.toString() + ' B/s';
	}

	$('#transferSpeedInfo').html('Tốc độ upload: ' + speed);
	$('#timeRemainingInfo').html('Thời gian còn lại: ' + secondsToString(secondsRemaining));
}

function secondsToString(seconds) {
	var h = Math.floor(seconds / 3600);
	var m = Math.floor(seconds % 3600 / 60);
	var s = Math.floor(seconds % 3600 % 60);
	return ((h > 0 ? h + ':' : '') + (m > 0 ? (h > 0 && m < 10 ? '0' : '') + m + ':' : '0:') + (s < 10 ? '0' : '') + s);
}

function uploadSuccess(evt) {
	/** @namespace data.msg */
	var data = JSON.parse(evt.target.response);
	$('.modal-body').html(data.msg);
	var title = 'Chia sẻ ' + fname;
	$('.modal-title').text(title);

	$('#source-data').html('');
	$('#fileInfo').html('');
	$('#upload-response').html('<p><b>Tập tin tải lên thành công: ' + fname + '</b></p>' +
		'<button type="button" class="btn btn-info" data-toggle="modal" data-target="#dialog-message" autofocus title="Chia sẻ">Chia sẻ</button>');
}

function uploadFailed() {
	alert('Lỗi xảy ra khi đang tải lên.');
}

function uploadComplete() {
	$('#form').find(':input').prop('disabled', false);
	clearInterval(intervalTimer);
}

function uploadCanceled() {
	clearInterval(intervalTimer);
	alert('Tải lên bị dừng bởi người dùng hoặc trình duyệt ngắt kết nối.');
}

$(document).ready(function() {
	$('#fileToUpload').on('change', fileSelected);
	$('#download').on('click', function() {
		$(this).html('<div style="padding: 8px">Đang tải xuống...</div>');
	});
});