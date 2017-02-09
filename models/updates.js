/*
 * Note Model
 * @Author zuogong
 *
 */

var Updates = function() {
	var mongoose = require('mongoose'),
		Schema = mongoose.Schema,
		updateSchema = new Schema({
			type: {
				type:String,
				required: true
			},
			content: {
				type: String,
				default: ''
			},
			content_id: {
				type: String,
				default: ''
			},
			text: {
				type: String,
				required: true
			},
			owner: {
				type:Schema.ObjectId,
				required: true
			},
			allowed_users: {
				type: [Schema.ObjectId],
				default: []
			},
			unread_users: {
				type: [Schema.ObjectId],
				default: []
			},
			date: {
				type: Date,
				default: Date.now
			}
		});

	return mongoose.model('Update', updateSchema);
}();

module.exports = Updates;

