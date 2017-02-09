/*
 * Token Model
 * @Author zuogong
 *
 */

 var Tokens = function () {
    "use strict";
	var mongoose = require('mongoose'),
		Schema = mongoose.Schema,
        tokenSchema = new Schema({
			userid: {
				type: String,
				required: true,
			},
			registration_id: {
				type: String,
				required: true
			},
			date: {
				type: Date,
				default: Date.now
			}
		});
	
	return mongoose.model('Token', tokenSchema);
}();

module.exports = Tokens;

