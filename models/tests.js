/*
 * Test Model
 * @Author rajkumarsoy
 *
 */

var Tests = function () {
	var mongoose = require('mongoose'),
		Schema = mongoose.Schema,
        testSchema = new Schema({
			question: {
				type: String,
				required: true,
				index: { unique: true }
			},
			option1: {
				type: String,
				default: ''
			},
			option2: {
				type: String,
				default: ''
			},
			option3: {
				type: String,
				default: ''
			},
			option4: {
				type: String,
				default: ''
			},
			answer: {
				type: String,
				default: ''
			},
			enabled: {
				type: String,
				default: 'true'
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

	return mongoose.model('Test', testSchema);
}();

module.exports = Tests;
