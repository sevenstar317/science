/*
 * social friends Model
 * @Author Prashant Mishra
 *
 */

var SocialFriend = function () {
	var mongoose = require('mongoose'),
		Schema = mongoose.Schema,
        SocialFriendSchema = new Schema({
			user: {
				type: String,
				required: true,
			},
			social_id : {
				type: String,
				default: ''
			},
			type : {
				type: String,
				default: ''
			},
			friends_list: []
		});
	return mongoose.model('SocialFriend', SocialFriendSchema);
}();

module.exports = SocialFriend;
