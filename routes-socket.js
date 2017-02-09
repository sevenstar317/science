var socketio = require('socket.io');
var os = require('os-utils');
global.socket = null;

module.exports = function (app) {
	var io = socketio(app);

	io.on('connection', function (socket) {
		global.socket = socket;
		socket.on('reqUsage', function(data) {
			var usage = {
				'totalmem': os.totalmem(),
				'freemem': os.freemem()
			};

			os.cpuUsage(function(result) {
				usage.cpu = result;
				socket.emit('resUsage', usage);
			});
		});
	});
}

