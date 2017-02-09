/*
 * User Model
 * @Author zuogong
 *
 */

var Users = function () {
    "use strict";
    var mongoose = require('mongoose'),
        validateEmail = function (email) {
            var re = /\S+@\S+\.\S+/;
            return re.test(email);
        },
        getMinValidator = function (val) {
            return function  (v) {
                if (v && v.length) {
                    return v.length >= val;
                }
            }
        },
        getMaxValidator = function (val) {
            return function  (v) {
                if (v && v.length) {
                    return v.length <= val;
                }
            }
        },

        Schema = mongoose.Schema,
        userSchema = new Schema({
			name: {
				type: String,
                required: true
			},
            email: {
                type: String,
                default:''
            },
            password: {
                type: String,
                required: true
            },
			school_name: {
				type: String,
				required: true
			},
			school_addr: {
				type: String,
				default: ''
			},
			school_city: {
				type: String,
				default: ''
			},
			school_postalcode: {
				type: String,
				default: ''
			},
			school_country: {
				type: String,
				default: ''
			},
			syllabus: {
				type: String,
				required: true
			},
			grade: {
				type: String,
				required: true
			},
			section: {
				type: String,
				required: true
			},
			photo: {
				type: String,
				default: ''
			},
			last_showed_chapter: {
				type: String,
				default: ''
			},
			last_showed_concept: {
				type: String,
				default: ''
			},
			update_on_users: {
				type: [Schema.ObjectId],
				default: []
			},
			friends: {
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
			logged: {
				type: String,
				default: 'false'
			},
			logged_date: {
				type: Date,
				default: Date.now
			},
			activation: {
				type: String,
				default: ''
			},
			disabled: {
				type: String,
				default: 'false'
			},
			social_id : {
				type: String,
				default: ''
			},
			social_type : {
				type: String,
				default: ''
			}
        });
/*
        userSchema.statics.saveUser = function (schema, cb) {
          this.create(schema, cb);
        };
*/
    return mongoose.model('User', userSchema);
}();

module.exports = Users;
