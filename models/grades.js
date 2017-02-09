/*
 * Grade Model
 * @Author zuogong
 *
 */

var Grades = function () {
	var mongoose = require('mongoose'),
		Schema = mongoose.Schema,
        gradeSchema = new Schema({
			grade: {
				type: String,
				required: true,
				index: { unique: true }
			},
			image: {
				type: String,
				default: ''
			},
			enabled: {
				type: String,
				default: 'false'
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

	return mongoose.model('Grade', gradeSchema);
}();

module.exports = Grades;
