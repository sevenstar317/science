/*
 * Link Model
 * @Author zuogong
 *
 */

var Link = function () {
	var mongoose = require('mongoose'),
		Schema = mongoose.Schema,
        linkSchema = new Schema({
			kind: {
				type: String,
				required: true,
			},
			syllabus: {
				type: String,
				required: true,
			},
			grade: {
				type: String,
				required: true,
			},
			chapter: {
				type: String,
				default: ''
			},
			concept: {
				type: String,
				default: ''
			},
			test: {
				type: String,
				default: ''
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

	return mongoose.model('Link', linkSchema);
}();

module.exports = Link;
