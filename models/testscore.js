/*
 * Test Model
 * @Author rajkumarsoy
 *
 */

var testScores = function () {
	var mongoose = require('mongoose'),
		Schema = mongoose.Schema,
        testScoresSchema = new Schema({
			user: {
				type: String,
				required: true,
			},
			chapter: {
				type: String,
				default: ''
			},
			test_title: {
				type: String,
				default: ''
			},
			score: {
				type: Number,
				default: ''
			},
			user_answer: {
				type: Array,
				default: ''
			},
			date: {
				type: Date,
				default: Date.now
			},
		});

	return mongoose.model('TestScore', testScoresSchema);
}();

module.exports = testScores;
