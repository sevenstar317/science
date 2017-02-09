var unit = 30;
var step = 6;
var cpuGraphWidth, cpuGraphHeight;
var cpuGraphCanvas, cpuGraphCtx;
var memGraphWidth, memGraphHeight;
var memGraphCanvas, memGraphCtx;
var shiftCpuDistance = 0;
var shiftMemDistance = 0;

var socket = io.connect($(location).attr('host'));
var cpuUsage = -1, freeMem = -1, totalMem = -1;
var prevCpuUsage = -1, prevFreeMemPercentage = -1;

var reqCnt = 0;

function drawCpuGrid() {
	var x, y;

	cpuGraphHeight = $('#cpu-usage-graph').height() * 2;
	cpuGraphWidth = $('#cpu-usage-graph').width() * 2;

	cpuGraphCanvas = document.getElementById("cpu-usage-graph");
	cpuGraphCtx = cpuGraphCanvas.getContext('2d');
	cpuGraphCanvas.width = cpuGraphWidth;
	cpuGraphCanvas.height = cpuGraphHeight;
	cpuGraphCtx.strokeStyle = '#3b8d3b';
	cpuGraphCtx.lineWidth = 2;
	cpuGraphCtx.beginPath();

	y = cpuGraphHeight - unit + 1;
	while (y > 0) {
		cpuGraphCtx.moveTo(0, y);
		cpuGraphCtx.lineTo(cpuGraphWidth, y);
		y = y - unit;
	}

	x = unit;
	while (x < cpuGraphWidth) {
		cpuGraphCtx.moveTo(x, 0);
		cpuGraphCtx.lineTo(x, cpuGraphHeight);
		x = x + unit;
	}

	cpuGraphCtx.closePath();
	cpuGraphCtx.stroke();
}

function drawMemGrid() {
	var x, y;

	memGraphHeight = $('#mem-usage-graph').height() * 2;
	memGraphWidth = $('#mem-usage-graph').width() * 2;

	memGraphCanvas = document.getElementById("mem-usage-graph");
	memGraphCtx = memGraphCanvas.getContext('2d');
	memGraphCanvas.width = memGraphWidth;
	memGraphCanvas.height = memGraphHeight;
	memGraphCtx.strokeStyle = '#3b8d3b';
	memGraphCtx.lineWidth = 2;
	memGraphCtx.beginPath();

	y = memGraphHeight - unit + 1;
	while (y > 0) {
		memGraphCtx.moveTo(0, y);
		memGraphCtx.lineTo(memGraphWidth, y);
		y = y - unit;
	}

	x = unit;
	while (x < memGraphWidth) {
		memGraphCtx.moveTo(x, 0);
		memGraphCtx.lineTo(x, memGraphHeight);
		x = x + unit;
	}

	memGraphCtx.closePath();
	memGraphCtx.stroke();
}

function redrawCpuGraph() {
	var cpuGraphImageData = cpuGraphCtx.getImageData(0, 0, cpuGraphWidth - step, cpuGraphHeight);
	cpuGraphCtx.putImageData(cpuGraphImageData, step, 0);

	shiftCpuDistance += step;
	if (shiftCpuDistance >= unit) {
		cpuGraphCtx.strokeStyle = '#3b8d3b';
		cpuGraphCtx.lineWidth = 2;
		cpuGraphCtx.beginPath();
		cpuGraphCtx.moveTo(unit, 0);
		cpuGraphCtx.lineTo(unit, cpuGraphHeight);
		cpuGraphCtx.closePath();
		cpuGraphCtx.stroke();
		shiftCpuDistance = 0;
	}

	if (prevCpuUsage >= 0) {
		cpuGraphCtx.strokeStyle = '#0D0';
		cpuGraphCtx.lineWidth = 3;
		cpuGraphCtx.beginPath();
		cpuGraphCtx.moveTo(unit + step, cpuGraphHeight - prevCpuUsage * cpuGraphHeight);
		cpuGraphCtx.lineTo(unit, cpuGraphHeight - cpuUsage * cpuGraphHeight);
		cpuGraphCtx.closePath();
		cpuGraphCtx.stroke();

		var cpuPercentage = (cpuUsage * 100) | 0;
		$('#cpu-usage .usage-chart .free').height(100 - cpuPercentage - 2);
		$('#cpu-usage .usage-chart .usage').height(cpuPercentage);
		$('#cpu-usage .usage-percentage').text(cpuPercentage + '%');
	}

	prevCpuUsage = cpuUsage;
}

function redrawMemGraph() {
	var memGraphImageData = memGraphCtx.getImageData(0, 0, memGraphWidth - step, memGraphHeight);
	memGraphCtx.putImageData(memGraphImageData, step, 0);

	shiftMemDistance += step;
	if (shiftMemDistance >= unit) {
		memGraphCtx.strokeStyle = '#3b8d3b';
		memGraphCtx.lineWidth = 2;
		memGraphCtx.beginPath();
		memGraphCtx.moveTo(unit, 0);
		memGraphCtx.lineTo(unit, memGraphHeight);
		memGraphCtx.closePath();
		memGraphCtx.stroke();
		shiftMemDistance = 0;
	}

	var freeMemPercentage;
	if (freeMem >= 0)
		if (totalMem >= 0)
			freeMemPercentage = freeMem / totalMem;
		else
			freeMemPercentage = 0;

	if (prevFreeMemPercentage >= 0) {
		memGraphCtx.strokeStyle = '#0D0';
		memGraphCtx.lineWidth = 3;
		memGraphCtx.beginPath();
		memGraphCtx.moveTo(unit + step, prevFreeMemPercentage * memGraphHeight);
		memGraphCtx.lineTo(unit, freeMemPercentage * memGraphHeight);
		memGraphCtx.closePath();
		memGraphCtx.stroke();

		var freeMemHeight = (freeMemPercentage * 100) | 0;
		$('#mem-usage .usage-chart .free').height(freeMemHeight - 2);
		$('#mem-usage .usage-chart .usage').height(100 - freeMemHeight);

		var memUsage = (totalMem - freeMem) / 1024;
		memUsage = (memUsage * 100 | 0) / 100;
		$('#mem-usage .usage-percentage').text(memUsage + 'GB');
	}

	prevFreeMemPercentage = freeMemPercentage;
}

function redrawGraph() {
	redrawCpuGraph();
	redrawMemGraph();
	socket.emit('reqUsage', {});

	reqCnt++;
	if (reqCnt >= 5) {
		cpuUsage = 0;
		freeMem = totalMem;
		$('#server-status .status').removeClass('label-success');
		$('#server-status .status').addClass('label-danger');
		$('#server-status .status').text('Failed');
	}
}

$(document).ready(function() {
	drawCpuGrid();
	drawMemGrid();
	
	socket.on('resUsage', function(data) {
		cpuUsage = data.cpu;
		totalMem = data.totalmem;
		freeMem = data.freemem;

		if (reqCnt >= 5) {
			$('#server-status .status').removeClass('label-danger');
			$('#server-status .status').addClass('label-success');
			$('#server-status .status').text('Normal');
		}
		reqCnt = 0;
	});

	setInterval(
		function(){
			redrawGraph();
		},
		1000
	);
});
