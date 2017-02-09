/*
 * Reference Model
 * @Author zuogong
 *
 */

var References = function () {
	var mongoose = require('mongoose'),
		Schema = mongoose.Schema,
        referenceSchema = new Schema({
			url: {
				type: String,
				required: true
			},
			title: {
				type: String,
				default: '',
			},
			description: {
				type: String,
				default: '',
			},
			image: {
				type: String,
				default: '',
			},
			owner: {
				type: String,		// user id
				default: 'admin',
			},
			concept: {
				type: Schema.ObjectId,
				required: true
			},
			enabled: {
				type: String,
				default: 'true'
			},
			shared_user: {
				type: [Schema.ObjectId],
				default: []
			},
			defaulted_user: {
				type: [Schema.ObjectId],
				default: []
			},
			privated_user: {
				type: [Schema.ObjectId],
				default: []
			},
			defaulted_admin: {
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
			},
			deleted: {
				type: Boolean,
				default: false
			}
		});

	return mongoose.model('Reference', referenceSchema);
}();

module.exports = References;
