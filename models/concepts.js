/*
 * Concept Model
 * @Author zuogong
 *
 */

var Concepts = function () {
	var mongoose = require('mongoose'),
		Schema = mongoose.Schema,
        conceptSchema = new Schema({
			code: {
				type: String,
				index: { unique: true }
			},
			title: {
				type: String,
				required: true
				//index: { unique: true }
			},
			text: {
				type: String,
				default: ''
			},
			image: {
				type: String,
				default: ''
			},
			image_url: {
				type: String,
				default: ''
			},
			image_source: {
				type: String,
				default: ''
			},
			image_credit: {
				type: String,
				default: ''
			},
			image2: {
				type: String,
				default: ''
			},
			image2_url: {
				type: String,
				default: ''
			},
			image2_source: {
				type: String,
				default: ''
			},
			image2_credit: {
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

	return mongoose.model('Concept', conceptSchema);
}();

module.exports = Concepts;
