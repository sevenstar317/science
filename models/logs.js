/*
 * Usage Log Model
 * @Author zuogong
 *
 */

var Logs = function() {
	var mongoose = require('mongoose'),
		Schema = mongoose.Schema,
		logSchema = new Schema({
			user: {
				type: Schema.ObjectId,
				required: true
			},
			type: {
				type: String,
				default: ''
			},
			log: {
				type: String,
				default: ''
			},
			content: {
				type: String,
				default: ''
			},
			date: {
				type: Date,
				default: Date.now
			}
		});

	return mongoose.model('Log', logSchema);
}();

module.exports = Logs;
