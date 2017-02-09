/*
 * Chapter Model
 * @Author zuogong
 *
 */

var Chapters = function () {
	var mongoose = require('mongoose'),
		Schema = mongoose.Schema,
        chapterSchema = new Schema({
			title: {
				type: String,
				required: true,
			},
			description: {
				type: String,
				default: ''
			},
			image: {
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

	return mongoose.model('Chapter', chapterSchema);
}();

module.exports = Chapters;
