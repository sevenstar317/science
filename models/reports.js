/*
 * Report Model
 * @Author zuogong
 *
 */

var Reports = function() {
	var mongoose = require('mongoose'),
		Schema = mongoose.Schema,
		reportSchema = new Schema({
			user: {
				type: Schema.ObjectId,
				required: true
			},
			reporter: {
				type: Schema.ObjectId,
				required: true
			},
			reason: {
				type: String,
				default: 'Not in Class'
			},
			date: {
				type: Date,
				default: Date.now
			}
		});

	return mongoose.model('Report', reportSchema);
}();

module.exports = Reports;

