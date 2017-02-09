/*
 * Content Model
 * @Author zuogong
 *
 */

var Contents = function () {
	var mongoose = require('mongoose'),
		Schema = mongoose.Schema,
        contentSchema = new Schema({
			type: {				// video, reference, note
				type: String,
				required: true
			},
			content: {
				type: Schema.ObjectId,
				required: true
			},
			concept: {
				type: Schema.ObjectId,
				required: true
			},
			user: {
				type: String,   // user id
				default: 'admin'
			},
			relation: {			// registerer, sharer
				type: String,
				default: 'sharer'
			},
			isDefault: {		// true, false
				type: String,
				default: 'false'
			},
			isPrivate: {		// true, false
				type: String,
				default: 'false'
			},
			date: {
				type: Date,
				default: Date.now
			}
		});

	return mongoose.model('Content', contentSchema);
}();

module.exports = Contents;
