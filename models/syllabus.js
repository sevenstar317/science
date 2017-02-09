/*
 * Syllabus Model
 * @Author zuogong
 *
 */

var Syllabus = function () {
	var mongoose = require('mongoose'),
		Schema = mongoose.Schema,
        syllabusSchema = new Schema({
			title: {
				type: String,
				required: true,
				index: { unique: true }
			},
			description: {
				type: String,
				default: ''
			},
			enabled: {
				type: String,
				default: 'true'
			},
			order: {
				type: Number,
				default: 0
			},
			date: {
				type: Date,
				default: Date.now
			},
			updated_date: {
				type: Date,
				default: Date.now
			}
		});

	return mongoose.model('Syllabus', syllabusSchema);
}();

module.exports = Syllabus;
