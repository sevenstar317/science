/*
 * Note Model
 * @Author zuogong
 *
 */

var Notes = function () {
	var mongoose = require('mongoose'),
		Schema = mongoose.Schema,
        noteSchema = new Schema({
			note: {
				type: String,
				required: true
			},
			owner: {
				type: String,		// user id
				default: 'admin',
			},
			concept: {
				type: Schema.ObjectId,
				required: true
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

	return mongoose.model('Note', noteSchema);
}();

module.exports = Notes;
