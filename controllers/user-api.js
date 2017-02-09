/*
 * User Controller
 * @Author zuogong
 */

var userApi = function () {
	var utils = require('../utils');
	var bcrypt;
	if (/^win/.test(process.platform)) {
		bcrypt = require('bcryptjs');
	} else {
		bcrypt = require('bcrypt');
	}
	var async = require('async');
	var fs = require('fs');

	var fromMailAddress = 'no-reply@scienceisfun.in';

	var nodemailer = require('nodemailer');
	var transporter = nodemailer.createTransport({
		service: 'Gmail',
		connectionTimeout: 90000,
		auth: {
			user: 'scienceisfun01@gmail.com',
			pass: 'romi2345'
		}
	});

	var actCodeLength = 20;
    var UserModel = require('../models/users'),
		TokenModel = require('../models/tokens'),
		SyllabusModel = require('../models/syllabus'),
		GradeModel = require('../models/grades'),
		UpdateModel = require('../models/updates'),
		ReportModel = require('../models/reports'),
		LogModel = require('../models/logs'),
                LinkModel = require('../models/links'),
                TestScoremodel = require('../models/testscore'),
		/*
		 * params: name
		 *       : email
		 *       : password
		 *       : confirm_password
		 *       : school_name
		 *       : school_addr
		 *       : school_city
		 *       : school_postalcode
		 *       : school_country
		 *       : syllabus
		 *       : grade
		 *       : section
		 *       : photo (image data)
		 */
		checkSignupParams = function (req, res, next) {
			if (!req.param('name') || req.param('name') == ''){
				return res.send({
					'status_code': 400,
					'message': 'Please enter your name.'
				});
			}

			var emailExp = /\S+@\S+\.\S+/;
			if (!req.param('email') || req.param('email') == ''){
				return res.send({
					'status_code': 400,
					'message': 'Please enter your email address.'
				});
			} else if (!emailExp.test(req.param('email'))){
				return res.send({
					'status_code': 400,
					'message': 'Please enter a valid email address.'
				});
			}

			if (!req.param('password') || req.param('password') == ''){
				return res.send({
					'status_code': 400,
					'message': 'Please enter the password.'
				});
			} else if (req.param('password').length < 6) {
				return res.send({
					'status_code': 400,
					'message': 'Password should have a minimum of 6 characters.'
				});
			}

			if (req.param('password') != req.param('confirm_password')) {
				return res.send({
					'status_code': 400,
					'message': 'Passwords do not match!'
				});
			}

			if (!req.param('school_name') || req.param('school_name') == ''){
				return res.send({
					'status_code': 400,
					'message': 'Please enter the name of your school.'
				});
			}

			if (!req.param('syllabus') || req.param('syllabus') == ''){
				return res.send({
					'status_code': 400,
					'message': 'Please select your board.'
				});
			}

			if (!req.param('grade') || req.param('grade') == ''){
				return res.send({
					'status_code': 400,
					'message': 'Please select your grade.'
				});
			}

			if (!req.param('section') || req.param('section') == ''){
				return res.send({
					'status_code': 400,
					'message': 'Please enter your section / room.'
				});
			}

			next();
		},
		/*
		 * params: name
		 *       : email
		 *       : password
		 *       : confirm_password
		 *       : school_name
		 *       : school_addr
		 *       : school_city
		 *       : school_postalcode
		 *       : school_country
		 *       : syllabus
		 *       : grade
		 *       : section
		 *       : photo (image data)
		 */
        signup = function (req, res) {
			var password = req.param('password');
			var rootPath = __dirname.substring(0, __dirname.lastIndexOf('/'));
			var photoPath = '';
			var tmpPhotoPath = '';
			var ext = '';
			 var schema = {
					'name': req.param('name'),
                                        'email': req.param('email'),
					'password': '',
					'school_name': req.param('school_name'),
					'school_addr': req.param('school_addr'),
					'school_city': req.param('school_city'),
					'school_postalcode': req.param('school_postalcode'),
					'school_country': req.param('school_country'),
					'syllabus': req.param('syllabus'),
					'grade': req.param('grade'),
					'section': req.param('section'),
					'photo': '',
					'update_on_users': [],
					'social_id': req.param('social_id') == null ? "" : req.param('social_id'),
					'social_type': req.param('social_type'),	
					'activation': (req.param('social_id') == ''?utils.randomString(actCodeLength):'')					
	            };

			for (var field in req.files) {
				if (req.files[field].originalFilename == ''
					|| req.files[field].size == 0 
					|| photoPath != '')
				{
					fs.unlinkSync(req.files[field].path);
					continue;
				}

				var filename = req.files[field].originalFilename;
				ext = filename.substring(filename.lastIndexOf('.'));
				tmpPhotoPath = req.files[field].path;
			}

			async.waterfall([
				function(cb) {
					UserModel.find({
						'school_name': req.param('school_name'),
						'grade': req.param('grade')
					}, function(err, grademates) {
						if (!err && grademates && grademates.length > 0) {
							var len = grademates.length;
							for (var i = 0; i < len; i++) {
								schema.update_on_users.push(grademates[i]._id);
							}
						}

						cb(null);
					});
				},
				function(cb) {
					bcrypt.genSalt(10, function (err, salt) {
						if(err){
							if (fs.existsSync(tmpPhotoPath))
								fs.unlinkSync(tmpPhotoPath);

							res.send({
								'status_code': 400,
								'message': 'Password encryption failed.'
							});
						}else{
							cb(null, salt);
						}
					});
				},
				function(salt, cb) {
					bcrypt.hash(password, salt, function (err, hash) {
						if(err){
							if (fs.existsSync(tmpPhotoPath))
								fs.unlinkSync(tmpPhotoPath);

							res.send({
								'status_code': 400,
								'message': 'Password encryption failed.'
							});
						}else{
							schema.password = hash;
							cb(null);
						}
					});
				},

				function(cb) {
					if(req.param('social_id')){
						UserModel.find({ "social_id": req.param('social_id'),"social_type":req.param('registration_type') }, function (err, user) {
							if(err) throw err;
							if(user){
								if(user.length > 0){
									res.send({
									'status_code': 400,
									'message': 'This social user is already registered.'
								});
								} else {
									cb(null);
								}
								
							}

						});
					} else{
						UserModel.find({ $and: [ { "email": req.param('email') }, { "social_id": "" } ] }, function (err, user) {
							if(err){

								res.send({
									'status_code': 400,
									'message': 'Somthing went wrong.'
								});
							}
							if(user){	
							if(user.length > 0){							
								message = 'The email address ' + req.param('email') + ' is already registered. Try with a different ID or select \'Forgot Password\'.';
								res.send({
									'status_code': 400,
									'message': message
								});
								} else {
									cb(null);
								}
							} else {
								cb(null);
							}
						});
					}
					
					
				},
				function(cb) {
					UserModel.create(schema, function (err, user, result) {
                    	if (err) {
                        	console.log(err);
                        	/* 
							 *  MongoError Check: Errors triggered from MongoDB.
                         	 *  Error code: 11000 shows already same value is existed for unique indexed field.
                         	 */
							var message = '';
                        	if (err.code == 11000) {
                           		var duplicatedValue = err.err.match(/"\S*/);
								if (duplicatedValue.constructor === Array )
                            		message = 'The email address ' + duplicatedValue[0] + ' is already registered. Try with a different ID or select \'Forgot Password\'.';
								else
									message = 'Sorry. Something went wrong. Registration was not successful. Please try again later.';
                        	} else {
                            	message = 'Sorry. Something went wrong. Registration was not successful. Please try again later.';
                        	}

							if (fs.existsSync(tmpPhotoPath))
								fs.unlinkSync(tmpPhotoPath);

							res.send({
								'status_code': 400,
								'message': message
							});
                    	} else {

                    		if(schema.photo == ""){
	                    			if (tmpPhotoPath != ''){
									photoPath = rootPath + '/files/users/' + user._id + ext;
									fs.renameSync(tmpPhotoPath, photoPath);

									if (fs.existsSync(tmpPhotoPath))
										fs.unlinkSync(tmpPhotoPath);

									if (fs.existsSync(photoPath))
										schema.photo = '/users/' + user._id + ext;
									else {
										UserModel.remove({'_id':user._id}, null);
										return res.send({
											'status_code': 400,
											'message': 'Sorry. Something went wrong. Image upload was not successful. Please try again later.'
										});
									}
								}
								//base64 Image
								var filename = rootPath + '/files/users/' + user._id + '.png';
								if (req.param('photo')) {
								var buf = req.param('photo');
								buf = buf.replace(/^data:image\/\w+;base64,/, "");
								buf = new Buffer(buf, 'base64');
								fs.writeFileSync(filename, buf);

								if (fs.existsSync(filename))
									schema.photo = '/users/' + user._id + '.png';
								else {
									UserModel.remove({'_id':user._id}, null);
									console.log('Failed to upload image.');
									return res.send({
										'status_code': 400,
										'message': 'Sorry. Something went wrong. Image upload was not successful. Please try again later.'
									});
								}
							}
								UserModel.update({'_id': user._id}, {'photo': schema.photo}, function(err, doc) {
									if (err && schema.photo != '') {
										UserModel.remove({'_id':user._id}, null);

										if (fs.existsSync(photoPath))
											fs.unlinkSync(photoPath);

										res.send({
											'status_code': 400,
											'message': 'Sorry. Something went wrong. Image upload was not successful. Please try again later.'
										});
									} else {
										cb(null, user);
									}
								});
                    		} else {
	                    			UserModel.update({'_id': user._id}, {'photo': schema.photo}, function(err, doc) {
									if (err && schema.photo != '') {
										UserModel.remove({'_id':user._id}, null);

										if (fs.existsSync(photoPath))
											fs.unlinkSync(photoPath);

										res.send({
											'status_code': 400,
											'message': 'Sorry. Something went wrong. Image upload was not successful. Please try again later.'
										});
									} else {
										cb(null, user);
									}
								});	
                    		}
						}
					});
				},
				function(user, cb) {
					var link = 'http://' + req.get('host') + '/accountactivation/' + user.activation + user._id;
					var html = '<p>Hi ' + user.name + ',</p>';
					html += '<p>To confirm your new account, please go to this web address:</p>';
					html += '<a href="' + link + '">' + link + '</a>';
					html += '<p style="margin-top:10px">In most mail programs, this should appear as a blue link which you can just click on.<br>';
					html += 'If that doesn\'t work, then cut and paste the address into the address line at the top of your web browser window.</p>';
					html += '<p>If you need help, please contact the site administrator(<a href="mailto:admin@scienceisfun.in">admin@scienceisfun.in</a>).</p>';

					var mailOptions = {
    					from: fromMailAddress, // sender address
    					to: user.email, // list of receivers
    					subject: 'Account Activation', // Subject line
    					text: 'Account Activation', // plaintext body
    					html: html // html body
					};
					if(req.param('social_id') == ''){

						transporter.sendMail(mailOptions, function(err, info){
							if (err) {
								console.log(err);
								UserModel.remove({'_id':user._id}, null);

								return res.send({
									'status_code': 400,
									'message': 'Sorry. Something went wrong. Registration was not successful. Please try again later.'
								});
							} else {
								cb(null, user);
							}
						});
					}	else {
						return res.send({
								'status_code': 200,
								'message': 'Account activated.',
								'userid': user._id
							});
							cb(null, user);

					}
				},
				function(user, cb) {
					// write log
					var logSchema = {
						'user': user._id,
						'type': 'sign up',
						'log': user.name + ' has signed up.'
					};

					LogModel.create(logSchema, function(err, log, result){});
					cb(null, user);
				},
				function(user, cb) {
					UserModel.update({
						'_id': {$ne: user._id},
						'school_name': user.school_name,
						'grade': user.grade,
						'update_on_users': {$ne: user._id}
					}, {
						$push: {'update_on_users': user._id}
					}, {
						multi: true
					}, function(err, result) {
					});

					GradeModel.findOne({'_id': user.grade}, function(err, grade){
						if (err || !grade) {
							return res.send({
								'status_code': 200,
								'message': 'Almost there. We sent you an email to verify your account. Please check your email to complete registration.',
								'userid': user._id
							});
						}

						cb(null, user, grade);
					});
				},
				function(user, grade, cb) {
					UserModel.find({
						'_id': {$in: user.update_on_users},
						'school_name': user.school_name,
						'grade': user.grade,
						'section': user.section
					}, function(err, classmates) {
						if (err || !classmates || classmates.length <= 0) {
							res.send({
								'status_code': 200,
								'message': 'Almost there. We sent you an email to verify your account. Please check your email to complete registration.',
								'userid': user._id
							});
						}

						var update_on_users = []
						var len = classmates.length;
						for (var i = 0; i < len; i++) {
							update_on_users.push(classmates[i]._id);
						}

						cb(null, user, update_on_users, grade);
					});
				},
				function(user, update_on_users, grade, cb) {
					var text = user.name + ' has joined ' + grade.grade + 'th Grade ';
					text += 'Section ' + user.section + ' at ' + user.school_name;

					UpdateModel.create({
						'type': 'joined',
						'text': text,
						'owner': user._id,
						'allowed_users': update_on_users,
						'unread_users': update_on_users,
					}, function(err, update, result) {
						res.send({
							'status_code': 200,
							'message': 'Almost there. We sent you an email to verify your account. Please check your email to complete registration.',
							'userid': user._id
						});

						sendNotification(update_on_users, update.text);
					});
				}
			]);	
        },
		/*
		 * params: email
		 *       : password
		 */
        signin = function (req, res) {
			if (!req.param('email')){
				return res.send({
					'status_code': 400,
					'message': 'Please enter your email address.'
				});
			}

			if (!req.param('password')){
				return res.send({
					'status_code': 400,
					'message': 'Please enter the password.'
				});
			}

			if (!req.param('registration_id') || req.param('registration_id') == ''){
				return res.send({
					'status_code': 400,
					'message': 'Please enter the device registration id for notification.'
				});
			}

			var password = req.param('password');
                        var objectGrade = {};
                        var objectSyllabuse = {};
			async.waterfall([
            	function(cb) {
					UserModel.findOne({ "email": req.param('email') }, function (err, user) {
						if(err) throw err;
						if (user) {
							if (user.activation != '') {
								req.session.activationId = user._id;
								res.send({
									'status_code': 400,
									'message': 'Your account is not yet activated. Please check your email to complete registration.'
								});
							} else if (user.disabled === 'true') {
								res.send({
									'status_code': 400,
									'message': 'Sorry. Your account was suspended.'
								});
							} else {
								cb(null, user);
							}
						} else {
                    		res.send({
								'status_code': 400,
								'message': 'Unable to sign in. Either your email or the password is wrong. Please try again.'
							});
                		}
					});
				},
				function(user, cb) {
					bcrypt.compare(password, user.password, function (err, auth) {
						if (!err && auth) {
							cb(null, user);
						} else {
							res.send({
								'status_code': 400,
								'message': 'Unable to sign in. Either your email or the password is wrong. Please try again.'
							});
						}
					});
				},
				function(user, cb) {
					TokenModel.remove({
						'userid': user._id,
						'registration_id': req.param('registration_id')
					}, function(err, result) {
						cb(null, user);
					});
				},
				function(user, cb) {
					TokenModel.create({
						'userid': user._id,
						'registration_id': req.param('registration_id')
					}, function(err, token, result) {
						if (err) {
							res.send({
								'status_code': 400,
								'message': 'Sorry. Something went wrong. Sign in was not successful. Please try again later.'
							});
						} else {
							cb(null, user, token._id);
						}
					});
				},
				function(user, tokenId, cb) {
					GradeModel.findOne({
						'_id': user.grade,
					}, function(err, grade) {
						if (err || !grade) {
							res.send({
								'status_code': 400,
								'message': 'Not found grade'
							});
						} else {
                                                    objectGrade.id = grade._id;
                                                    objectGrade.grade = grade.grade;
							cb(null, user, tokenId);
						}
					});
				},
				function(user, tokenId, cb) {
					SyllabusModel.findOne({
						'_id': user.syllabus,
					}, function(err, syllabus) {
						if (err || !syllabus) {
							res.send({
								'status_code': 400,
								'message': 'Not found syllabus'
							});
						} else {
                                                    objectSyllabuse.id = syllabus._id;
                                                    objectSyllabuse.title = syllabus.title;
							cb(null, user, tokenId);
						}
					});
				},
				function(user, token, cb) {
					UserModel.update({
						'_id': user._id
					}, {
						$set: {'logged': 'true', 'logged_date': new Date()}
					}, function(err, result) {
						if (err) {
							return res.send({
								'status_code': 400,
								'message': 'Sorry. Something went wrong. Sign in was not successful. Please try again later.4'
							});
						}
                                                var  userRespond = {
                                                  name: user.name,
                                                  school_name: user.school_name,
                                                  school_addr: user.school_addr,
                                                  school_city: user.school_city,
                                                  school_postalcode: user.school_postalcode,
                                                  school_country: user.school_country,
                                                  syllabus: objectSyllabuse,
                                                  grade: objectGrade,
                                                  section: user.section,
                                                  photo: user.photo
                                                };
						res.send({
							'status_code': 200,
							'message': 'Signed in successfully',
                                                        'user' : userRespond,
							'token': token
						});

						cb(null, user);
					});
				},
				function(user, cb) {
					// write log
					var logSchema = {
						'user': user._id,
						'type': 'sign in',
						'log': user.name + ' has signed in.',
					};

					LogModel.create(logSchema, function(err, log, result){});
				}
			]);
        },
		/*
		 * params: token
		 */
		checkToken = function (req, res, next){
			req.user = null;
                        
			TokenModel.findOne({'_id': req.param('token')}, function(err, token) {
				if (!err && token){
					UserModel.findOne({ '_id': token.userid }, function (error, user) {
						if (!error && user){
							if (user.disabled === 'true') {
								return res.send({
									'status_code': 400,
									'message': "Sorry. Your account was suspended."
								});
							} else {
								req.user = user;
								next();
							}
						} else {
							return res.send({
								'status_code': 400,
								'message': "Sorry. This user is not registered."
							});
						}
					});
				} else {
					return res.send({
						'status_code': 400,
						'message': 'Unknown token'
					});
				}
			});
		},
		/*
		 * params: token
		 */
        signout = function (req, res) {
			async.waterfall([
			function(cb) {
				UserModel.update({
					'_id': req.user._id
				}, {
					$set: {'logged': 'false'}
				}, function(err, result) {
					if (err) {
						return res.send({
							'status_code': 400,
							'message': 'Sorry. Something went wrong. Sign out was not successful. Please try again later.'
						});
					}

					// write log
					var logSchema = {
						'user': req.user._id,
						'type': 'sign out',
						'log': req.user.name + ' has signed out.'
					};
					LogModel.create(logSchema, function(err, log, result){});

            		TokenModel.remove({'_id': req.param('token')}, null);
					res.send({
						'status_code': 200,
						'message': 'Thank you. You are signed out.'
					});
				});
			}]);
        },
		/*
		 * params: token
		 *         checksum
		 */
		getProfile = function (req, res) {
			if (req.param('checksum') && req.param('checksum') != '' &&
				req.param('checksum') == utils.convertDateToNum(req.user.updated_date))
			{
				return res.send({
					'status_code': 210,
					'message': 'The profile was not updated.',
				});
			}
			
		
			var profile = {
				'id': req.user._id,
				'name': req.user.name,
				'email': req.user.email,
				'school_name': req.user.school_name,
				'school_addr': req.user.school_addr,
				'school_city': req.user.school_city,
				'school_postalcode': req.user.school_postalcode,
				'school_country': req.user.school_country,
				'syllabus': {},
				'grade': {},
				'section': req.user.section,
				'photo': req.user.photo,
				'date': req.user.date,
				'updated_date': req.user.updated_date,
				'social_id': req.user.social_id,
                                'percentage': 0,
                                'classmates': 0
			};
                        var objectGrade = {};
                        var objectSyllabuse = {};
			async.waterfall([
                            function(cb) {
				    LinkModel.find({'kind':'test','grade':profile.grade,'syllabus': profile.syllabus},function (err,tests){
				    	if(err) throw err;

				    	TestScoremodel.find({'user': profile.id},function (err, testscore){
				    		if(err||!testscore) {
				    			console.log('Did not get score');
				    			profile.percentage = 0;
				    		} else {
                                                        var countTests = tests.length == 0 ? 1 : tests.length;
                                                        console.log(countTests);
                                                        profile.percentage = Math.floor((testscore.length/countTests)*100);
				    		}
				    		cb(null);
				    	});
				    });
                            },
                            function(cb) {
					GradeModel.findOne({
						'_id': req.user.grade,
					}, function(err, grade) {
						if (err || !grade) {
							res.send({
								'status_code': 400,
								'message': 'Not found grade'
							});
						} else {
                                                    objectGrade.id = grade._id;
                                                    objectGrade.grade = grade.grade;
							cb(null);
						}
					});
                            },
                            function(cb) {
                                    SyllabusModel.findOne({
                                            '_id': req.user.syllabus,
                                    }, function(err, syllabus) {
                                            if (err || !syllabus) {
                                                    res.send({
                                                            'status_code': 400,
                                                            'message': 'Not found syllabus'
                                                    });
                                            } else {
                                                objectSyllabuse.id = syllabus._id;
                                                objectSyllabuse.title = syllabus.title;
                                                    cb(null);
                                            }
                                    });
                            },
                            function (cb) {
                                    UserModel.find({
                                            '_id': {$in: req.user.update_on_users},
                                            'school_name': profile.school_name,
                                            'grade': profile.grade,
                                            'section': profile.section
                                    }, function(err, classmates) {
                                            profile.classmates = classmates.length;
                                            profile.grade = objectGrade;
                                            profile.syllabus = objectSyllabuse;
                                    res.send({
                                        'status_code': 200,
                                        'message': 'The profile was got successfully',
                                        'profile': profile
                                    });
                                });
                            },
                        ]);


		},
		/*
		 * params: token
		 *       : name
		 *       : school_name
		 *       : school_addr
		 *       : school_city
		 *       : school_postalcode
		 *       : school_country
		 *       : syllabus
		 *       : grade
		 *       : section
		 *       : photo (image data)
		 *       : photo_removed
		 */
		checkProfileParams = function (req, res, next) {
			if (!req.param('name') || req.param('name') == ''){
				return res.send({
					'status_code': 400,
					'message': 'Please enter your name.'
				});
			}

			if (!req.param('school_name') || req.param('school_name') == ''){
				return res.send({
					'status_code': 400,
					'message': 'Please enter the name of your school.'
				});
			}

			if (!req.param('syllabus') || req.param('syllabus') == ''){
				return res.send({
					'status_code': 400,
					'message': 'Please select your board.'
				});
			}

			if (!req.param('grade') || req.param('grade') == ''){
				return res.send({
					'status_code': 400,
					'message': 'Please select your grade.'
				});
			}

			if (!req.param('section') || req.param('section') == ''){
				return res.send({
					'status_code': 400,
					'message': 'Please enter your section / room.'
				});
			}

			next();
		},
		/*
		 * params: token
		 *       : name
		 *       : school_name
		 *       : school_addr
		 *       : school_city
		 *       : school_postalcode
		 *       : school_country
		 *       : syllabus
		 *       : grade
		 *       : section
		 *       : photo (image data)
		 *       : photo_removed
		 */
		setProfile = function (req, res){
                var updateSchema = {
                    'name': req.param('name'),
                    'school_name': req.param('school_name'),
                    'school_addr': req.param('school_addr'),
                    'school_city': req.param('school_city'),
                    'school_postalcode': req.param('school_postalcode'),
                    'school_country': req.param('school_country'),
                    'syllabus': req.param('syllabus'),
                    'grade': req.param('grade'),
                    'section': req.param('section'),
                    'photo': req.user.photo,
                    'updated_date': new Date
                };
                if (req.param('password') && (req.param('password') !== '') && (req.param('password').length >= 6)) {
                    updateSchema.password = '';
                }

                if (req.param('password') && (req.param('password') !== '') && (req.param('password').length < 6)) {
                    return res.send({
                        'status_code': 400,
                        'message': 'Password is too short.'
                    });
                }
			var rootPath = __dirname.substring(0, __dirname.lastIndexOf('/'));
			var tmpPhotoPath = '';
			var photoPath = '';

			for (var field in req.files) {
				if (req.param('photo_removed') == 'removed'
					|| req.files[field].originalFilename == ''
					|| req.files[field].size == 0 
					|| photoPath != '')
				{
					fs.unlinkSync(req.files[field].path);
					continue;
				}
					
				var filename = req.files[field].originalFilename;
				var ext = filename.substring(filename.lastIndexOf('.'));
				photoPath = rootPath + '/files/users/' + req.user._id + ext;
				updateSchema.photo = '/users/' + req.user._id + ext;
				tmpPhotoPath = req.files[field].path;
			}

			if (req.param('photo_removed') == 'removed') {
				updateSchema.photo = '';
			}

			async.waterfall([
                            function (cb) {
                                if (req.param('password') && (req.param('password') !== '') && (req.param('password').length >= 6)) {
                                    bcrypt.genSalt(10, function (err, salt) {
                                        if (err) {
                                            res.send({
                                                'status_code': 400,
                                                'message': 'Password encryption failed.'
                                            });
                                        } else {
                                            cb(null, salt);
                                        }
                                    });
                                } else {
                                    cb(null, null);
                                }
                            },
                            function (salt, cb) {
                                if (salt) {
                                    bcrypt.hash(req.param('password'), salt, function (err, hash) {
                                        if (err) {
                                            res.send({
                                                'status_code': 400,
                                                'message': 'Password encryption failed.'
                                            });
                                        } else {
                                            updateSchema.password = hash;
                                            cb(null);
                                        }
                                    });
                                } else {
                                    cb(null);
                                }
                            },
			function(cb) {
            	UserModel.update({ '_id': req.user._id }, updateSchema, function (e, resultSet) {
                    if (e) {
                    	var message = '';
                        if (e.code == 11001) {
                            var duplicatedValue = e.err.match(/"\S*/);
							if (duplicatedValue.constructor === Array )
                            	message = 'The email address ' + duplicatedValue[0] + ' is already registered. Try with a different ID or select \'Forgot Password\'.';
							else
								message = 'Sorry. Something went wrong. Profile update was not successful. Please try again later.';
                        } else {
							message = 'Sorry. Something went wrong. Profile update was not successful. Please try again later.';
                        }

						console.log('Failed to update profile.');

						if (fs.existsSync(tmpPhotoPath))
							fs.unlinkSync(tmpPhotoPath);

						res.send({
							'status_code': 400,
							'message': message
						});
                    } else {
						if (req.param('photo_removed') == 'removed') {
							if (req.user.photo != ''
								&& fs.existsSync(rootPath + '/files' + req.user.photo))
							{
								fs.unlinkSync(rootPath + '/files' + req.user.photo);
							}
						}

						if (photoPath != '') {
							if (req.user.photo != ''
								&& fs.existsSync(rootPath + '/files' + req.user.photo))
							{
								fs.unlinkSync(rootPath + '/files' + req.user.photo);
							}

							if (fs.existsSync(tmpPhotoPath))
								fs.renameSync(tmpPhotoPath, photoPath);
						}

						cb(null);
                    }
                });
			},
			function(cb) {
				var logSchema = {
					'user': req.user._id,
					'type': 'change profile',
					'log': req.user.name + ' has changed the profile.'
				};

				LogModel.create(logSchema, function(err, log, result){});
				cb(null);
			},
			function(cb){
				if (req.user.school_name == updateSchema.school_name &&
					req.user.grade == updateSchema.grade &&
					req.user.section == updateSchema.section)
				{
					console.log('Succeeded to update profile.');
					return res.send({
						'status_code': 200,
						'message': 'Your profile was updated successfully.',
						'photo': req.protocol + '://' + req.get('host') + updateSchema.photo
					});
				}

				UserModel.update({
					'_id': {$ne: req.user._id},
					'school_name': req.user.school_name,
					'grade': req.user.grade
				}, {
					$pull: {'update_on_users': req.user._id}
				}, {
					multi: true
				}, function(err, user) {
					UserModel.update({
						'_id': {$ne: req.user._id},
						'school_name': updateSchema.school_name,
						'grade': updateSchema.grade
					}, {
						$push: {'update_on_users': req.user._id}
					}, {
						multi:true
					}, function(err, user) {
						cb(null);
					});
				});
			},
			function(cb) {
				UserModel.find({
					'_id': {$ne: req.user._id},
					$or: [
						{
							'school_name': req.user.school_name,
							'grade': req.user.grade
						},
						{
							'school_name': updateSchema.school_name,
							'grade': updateSchema.grade
						}
					]
				}, function(err, users) {
					if (err || !users) {
						console.log('Succeeded to update profile.');
						return res.send({
							'status_code': 200,
							'message': 'Your profile was updated successfully.',
							'photo': req.protocol + '://' + req.get('host') +updateSchema.photo
						});
					}

					var len = users.length;
					for (var i = 0; i < len; i++) {
						if (users[i].school_name == updateSchema.school_name &&
								 users[i].grade == updateSchema.grade)
						{
							req.user.update_on_users.pull(users[i]._id);
							req.user.update_on_users.push(users[i]._id);
						} 
						else if (users[i].school_name == req.user.school_name &&
							users[i].grade == req.user.grade)
						{
							req.user.update_on_users.pull(users[i]._id);
						}
					}

					cb(null);
				});
			},
			function(cb) {
				UserModel.update({
					'_id': req.user._id
				}, {
					'update_on_users': req.user.update_on_users
				}, function(err, result){
					cb(null);
				});
			},
			function(cb){
				GradeModel.findOne({'_id': updateSchema.grade}, function(err, grade){
					if (err || !grade) {
						console.log('Succeeded to update profile.');
						return res.send({
							'status_code': 200,
							'message': 'Your profile was updated successfully.',
							'photo': req.protocol + '://' + req.get('host') +updateSchema.photo
						});
					}

					cb(null, grade);
				});
			},
			function(grade, cb) {
				UserModel.find({
					'_id': {$in: req.user.update_on_users},
					'school_name': req.user.school_name,
					'grade': req.user.grade,
					'section': req.user.section
				}, function(err, classmates) {
					if (err || !classmates || classmates.length <= 0) {
						return res.send({
							'status_code': 200,
							'message': 'Your profile was updated successfully.',
							'photo': req.protocol + '://' + req.get('host') +updateSchema.photo
						});
					}

					var update_on_users = []
					var len = classmates.length;
					for (var i = 0; i < len; i++) {
						update_on_users.push(classmates[i]._id);
					}

					cb(null, update_on_users, grade);
				});
			},
			function(update_on_users, grade, cb) {
				var text = updateSchema.name + ' has joined ' + grade.grade + 'th Grade ';
				text += 'Section ' + updateSchema.section + ' at ' + updateSchema.school_name;

				UpdateModel.create({
					'type': 'joined',
					'text': text,
					'owner': req.user._id,
					'allowed_users': update_on_users,
					'unread_users': update_on_users,
				}, function(err, update, result) {
					console.log('Succeeded to update profile.');
					res.send({
						'status_code': 200,
						'message': 'Your profile was updated successfully.',
						'photo': req.protocol + '://' + req.get('host') +updateSchema.photo
					});

					sendNotification(update_on_users, update.text);
				});
			}]);
		},
		/* Second middleware method for route "app.post('/password', ..."  */
        checkCurrentPasswordMatch = function (req, res, next) {
            req.checkCurrentPasswordMatch = false;
			bcrypt.compare(req.param('old_password'), req.user.password, function (error, auth) {
				if (!error && auth) {
					req.checkCurrentPasswordMatch = true;
				} else {
					return res.send({
						'status_code': 400,
						'message': "The current password is wrong. Please try again." 
					});
				}
				next();
			});
        },
        /* Third middleware method for route "app.post('/password', ..."  */
        checkPasswordsMatch = function (req, res, next) {
            req.checkPasswordsMatch = false;
            if (req.param('new_password') == req.param('confirm_password')) {
                req.checkPasswordsMatch = true;
            } else {
				return res.send({
					'status_code': 400,
					'message': "New passwords do not match. Please try again." 
				});
            }
            next();
        },
        /* Final callback method for route "app.post('/password', ..."
		 *
		 * params: token
		 *       : old_password
		 *       : new_password
		 *       : confirm_password
		 */
		changePassword = function (req, res){
			var pass = req.param('new_password');
			if (pass.length < 6) {
				return res.send({
					'status_code': 400,
					'message': "The new password should have a minimum of 6 characters." 
				});
			}

			async.waterfall([
				function (cb){
					bcrypt.genSalt(10, function (err, salt) {
						if(err){
							return res.send({
								'status_code': 400,
								'message': "Sorry. Something went wrong. Password change was not successful. Please try again later." 
							});
						}else{
							bcrypt.hash(pass, salt, function (error, hash) {
								if(!error){
									cb(null, hash);
								} else {
									return res.send({
										'status_code': 400,
										'message': "Sorry. Something went wrong. Password change was not successful. Please try again later." 
									});
								}
							});
						}
					});
				},
				function (hash, cb){
					UserModel.update({ '_id': req.user._id }, {'password': hash}, function (err, resultSet) {
                		if (err) {
							return res.send({
								'status_code': 400,
								'message': 'Sorry. Something went wrong. Password change was not successful. Please try again later.' 
							});
               			} else {
							res.send({
								'status_code': 200,
								'message': "Your password was changed successfully." 
							});

							cb(null);
                		}
           			});
				},
				function(cb) {
					var logSchema = {
						'user': req.user._id,
						'type': 'change password',
						'log': req.user.name + ' has changed the password.'
					};

					LogModel.create(logSchema, function(err, log, result){});
				}
			]);
		},
		/*
		 * params: email
		 */
		checkResetPasswordParams = function (req, res, next) {
			var emailExp = /\S+@\S+\.\S+/;
			if (!req.param('email') || req.param('email') == ''){
				return res.send({
					'status_code': 400,
					'message': 'Please enter your email address.'
				});
			} else if (!emailExp.test(req.param('email'))){
				return res.send({
					'status_code': 400,
					'message': 'Please enter a valid email address.'
				});
			}

			next();
		},
		/*
		 * params: email
		 */
		resetPassword = function (req, res){
			var mail_address = req.param('email');
			var newPass = utils.randomString(8);

			async.waterfall([
				function (cb){
					bcrypt.genSalt(10, function (err, salt) {
						if(err){
							console.log("Failed to encrypt password.");
							res.send({
								'status_code': 400,
								'message': 'Sorry. Something went wrong. Password reset was not successful. Please try again later.'
							});
						}else{
							bcrypt.hash(newPass, salt, function (error, hash) {
								if(!error){
									cb(null, hash);
								} else {
									console.log("Failed to encrypt password.");
									res.send({
										'status_code': 400,
										'message': 'Sorry. Something went wrong. Password reset was not successful. Please try again later.'
									});
								}
							});
						}
					});
				},
				function(hash,cb){
					UserModel.find({'email': mail_address,'social_id':''},function(err,user){
						if(err) throw err;
						if(user){
							var userID = user[0]._id;
							cb(null,hash,userID);
						} else {
							res.send({
								'status_code': 400,
								'message': "This email is not registered. Please try again or Register as a new user."
							});
						}

					});
				},
				function(hash,userID, cb) {
					UserModel.update({'_id': userID}, {'password': hash}, function(err, doc){
						if (!err && doc) {
							var html = '<div style="width:500px;background:#F3F7F8;">';
							html += '<div style="background:#D6FCD4;padding:20px 10px">';
							html += '<p style="font-size:30px;float:left;margin: 0 10px 0 0;color: #2E752A;">ScienceIsFun</p>';
							html += '</div>';
							html += '<div style="padding:10px">';
							html += '<p style="text-align: center;margin-top: 150px;">Password : ' + newPass + '</p>';
							html += '<p style="text-align: center;margin-top: 150px;">2014 &copy; ScienceIsFun.com</p>';
							html += '</div>';
							html += '</div>';
							var mailOptions = {
    							from: fromMailAddress, // sender address
    							to: mail_address, // list of receivers
    							subject: 'New Password', // Subject line
    							text: newPass, // plaintext body
    							html: html // html body
							};

							transporter.sendMail(mailOptions, function(error, info){
    							if(error){
        							console.log("Failed to send new password.");
									res.send({
										'status_code': 400,
										'message': 'Sorry. Something went wrong. Password reset was not successful. Please try again later.'
									});
    							}else{
									console.log('Succeeded to send new password.');
        							res.send({
										'status_code': 200,
										'message': 'Please check your mail. We have sent you a temporary password.'
									});

									cb(null);
    							}
							});
						} else {
							console.log('Email address is not registered.');
							res.send({
								'status_code': 400,
								'message': "This email is not registered. Please try again or Register as a new user."
							});
						}
					});
				},
				function(cb) {
					UserModel.findOne({'email': mail_address}, function(err, user) {
						if (err || !user)
							return;

						var logSchema = {
							'user': user._id,
							'type': 'reset password',
							'log': user.name + ' has reset the password.'
						};

						LogModel.create(logSchema, function(err, log, result){});
					});
				}
			]);
		},
		/*
		 * param: checksum
		 *        start
		 *        count
		 */
		checkUpdateUsers = function(req, res, next) {
			if (!req.param('start')) {
				return res.send({
					'status_code': 400,
					'message': 'Please enter the start position of users.'
				});
			}

			if (!req.param('count')) {
				return res.send({
					'status_code': 400,
					'message': 'Please enter the count of users.'
				});
			}

			if (req.param('start') * 1 > 0) {
				next();
				return;
			}

			UserModel.find({
				'activation': ''
			}, function(err, users){
				if (err || !users || users.length <= 0) {
					console.log('Failed to get users.');
					res.send({
						'status_code': 200,
						'message': 'Users not found.',
						'users': [],
						'eof': 'true'
					});
				} else {
					var len = users.length;
					var checksum = 0;

					for (var i = 0; i < len; i++) {
						checksum += utils.convertDateToNum(users[i].updated_date);
					}

					if (req.param('checksum') && 
						req.param('checksum') != '' &&
						req.param('checksum') == checksum )
					{
						res.send({
							'status_code': 210,
							'message': 'No updated.',
						});
					} else {
						next();
					}
				}
			});
		},
		/*
		 * params: checksum
		 */
		getTotalUsers = function(req, res) {
			UserModel.find({
				'activation': ''
			}, {}, {
				skip: req.param('start') * 1,
				limit: req.param('count') * 1,
				sort: {'date':1, '_id':1}
			}, function (err, users) {
                if (err || !users || users.length <= 0) {
					console.log('Failed to get users.');
					res.send({
						'status_code': 200,
						'message': 'Users not found.',
						'users': [],
						'eof': 'true'
					});
				} else {
					var len = users.length;
					var eof = 'false';
					for (var i = 0; i < len; i++) {
						if (users[i].photo != '')
							users[i].photo = req.protocol + '://' + req.get('host') + users[i].photo;
						if (users[i].google_photo != '')
							users[i].google_photo = req.protocol + '://' + req.get('host') + users[i].google_photo;
						if (users[i].facebook_photo != '')
							users[i].facebook_photo = req.protocol + '://' + req.get('host') + users[i].facebook_photo;					

						delete users[i].password;
						delete users[i].activation;
					}

					if (len < req.param('count') * 1)
						eof = 'true';
					
					console.log('Succeeded to get users.');
					res.send({
						'status_code': 200,
						'message': 'Users were got successfully.',
						'users': users,
						'eof': eof
					});
				}
			});
		},
		/*
		 * params: email
		 */
		verifyEmail = function(req, res) {
			var emailExp = /\S+@\S+\.\S+/;
			if (!req.param('email') || req.param('email') == ''){
				return res.send({
					'status_code': 400,
					'message': 'Please enter your email address.'
				});
			} else if (!emailExp.test(req.param('email'))){
				return res.send({
					'status_code': 400,
					'message': 'Please enter a valid email address.'
				});
			}

			UserModel.findOne({'email': req.param('email'),'social_id': req.param('social_id')}, function(err, user){
				if (err){
					console.log('Failed to get user.');
					res.send({
						'status_code': 400,
						'message': 'Email verification was not successful. Please try again.'
					});
				} else if (user) {
					console.log('Succeeded to get user.');
					res.send({
						'status_code': 200,
						'message': 'The email address ' + req.param('email') + ' is already registered.',
						'duplicated': 'true'
					});
				} else {
					console.log('Not found user.');
					res.send({
						'status_code': 200,
						'message': 'The email address is valid.',
						'duplicated': 'false'
					});
				}
			});
		},
		sendNotification = function(update_on_users, text){
			async.waterfall([
			function(cb) {
				UserModel.find({
						'_id': {$in: update_on_users},
					}, function(err, classmates) {
						if (err || !classmates || classmates.length <= 0) {
							return;
						}

						var receivers = '';
						var len = classmates.length;
						for (var i = 0; i < len; i++) {
							receivers += classmates[i].email + ', ';
						}

						logger.trace(receivers);
						var mailOptions = {
	    					from: fromMailAddress,
    						to: receivers,
    						subject: '[ScienceisFun] Updates',
    						text: text,
    						html: text
						};

						transporter.sendMail(mailOptions, function(error, info){
							if (error) {
								console.log('Failed to send notification mail.');
								console.log(error);
								console.log(info);
							} else {
								console.log('Succeeded to send notification mail.');
								console.log(info);
							}
						});

					});
			}
			/*function(cb) {
				TokenModel.find({'userid': {$in: update_on_users}}, function(err, tokens){
					if (err || !tokens | tokens.length <= 0)
						return;

					var registration_ids = [];
					var len = tokens.length;
					for (var i = 0; i < len; i++) {
						registration_ids.push(tokens[i].registration_id);
					}

					cb(null, registration_ids);
				});
			},
			function(registration_ids, cb) {
				var gcm = require('node-gcm-service');
				var message = new gcm.Message();
				message.setDataWithObject({'text': text});
				message.setCollapseKey('scienceisfun');
				message.setDryRun(false);
				message.setDelayWhileIdle(true);

				var sender = new gcm.Sender();
				sender.setAPIKey('AIzaSyAzPYLRYina5ozWsy1673GD0JiOVl9BDSQ');

				var len = registration_ids.length;
				for (var i = 0; i < len; i++) {
					var reg_ids = [registration_ids[i]];
					sender.sendMessage(message.toString(), reg_ids, true, function(err, data) {
						if (err) {
							console.log('Failed to send notification.');
							console.log(err);
						} else {
							console.log('Succeeded to send notification.');
							console.log(data);
						}
					});
				}
			}*/
			]);
		},
		reportUser = function(req, res) {
			if (!req.param('user_id') || req.param('user_id') == '') {
				console.log('Failed to report user.');
				return res.send({
					'status_code': 400,
					'message': 'Please enter email address of user to be reported.'
				});
			}

			if (!req.param('reason') || req.param('reason') == '') {
				console.log('Failed to report user.');
				return res.send({
					'status_code': 400,
					'message': 'Please provide a reason. This helps us take required steps.'
				});
			}

			async.waterfall([
			function(cb) {
				ReportModel.find({
					'user': req.param('user_id'),
					'reporter': req.user._id
				}, function(err, reports) {
					if (err) {
						console.log('Failed to report user.');
						return res.send({
							'status_code': 400,
							'message': 'Sorry. Something went wrong. The user was not reported. Please try again later.'
						});
					}
					
					var exist = 'true';
					if (!reports || reports.length <= 0)
						exist = false;

					cb(null, exist);
				});
			},
			function(exist, cb) {
				if (exist) {
					ReportModel.update({
						'user': req.param('user_id'),
						'reporter': req.user._id
					}, {
						'reason': req.param('reason'),
						'date': new Date()
					}, function(err, result) {
						if (err) {
							console.log('Failed to report user.');
							res.send({
								'status_code': 400,
								'message': 'Sorry. Something went wrong. The user was not reported. Please try again later.'
							});
						} else {
							console.log('Succeeded to report user.');
							res.send({
								'status_code': 200,
								'message': 'Thank you for reporting this user. We\'ll look into this more closely.'
							});
						}
					});
				} else {
					ReportModel.create({
						'user': req.param('user_id'),
						'reporter': req.user._id,
						'reason': req.param('reason')
					}, function(err, report, result) {
						if (err) {
							console.log('Failed to report user.');
							res.send({
								'status_code': 400,
								'message': 'Sorry. Something went wrong. The user was not reported. Please try again later.'
							});
						} else {
							console.log('Succeeded to report user.');
							res.send({
								'status_code': 200,
								'message': 'Thank you for reporting this user. We\'ll look into this more closely.'
							});

							cb(null, report._id);
						}
					});
				}
			},
			function(report_id, cb) {
				UserModel.findOne({'_id': req.param('user_id')}, function(err, user) {
					if (err || !user)
						return;

					var logSchema = {
						'user': req.user._id,
						'type': 'report',
						'log': req.user.name + ' has reported ' + user.name + '.',
						'content': report_id
					};

					LogModel.create(logSchema, function(err, log, result){});
				});
			}]);
		},
                getInputSingup = function (req, res) {
                    async.waterfall([function(cb) {
				SyllabusModel.find({
				}, {
					'title': 1,
					'order': 1
				}, {
					sort: {'order': 1}
				}, function(err, syllabuses){
					if (err || !syllabuses || syllabuses.length <= 0) {
						console.log('Failed to get syllabuses.');
						res.render('signup', {'syllabuses':[], 'grades':[], 'social_user' : social_user_info});
					} else {
						var len = syllabuses.length;
						var resSyllabuses = [];
		
						for (var i = 0; i < len; i++) {
							var syllabus = syllabuses[i];
							resSyllabuses.push({
								'id': syllabus._id,
								'title': syllabus.title,
							});
						}
						console.log('Succeeded to get syllabuses.');
						cb(null, resSyllabuses);
					}
				});
			},
			function(resSyllabuses, cb) {
				GradeModel.find({}, {}, {sort: {'date':1}}, function(err, grades){
					if (err || !grades || grades.length <= 0) {
						console.log('Failed to get grades.');
						res.render('signup', {'syllabuses':resSyllabuses, 'grades':[], 'social_user' : social_user_info});
						
					} else {
						var len = grades.length;
						var resGrades = [];
		
						for (var i = 0; i < len; i++) {
							var grade = grades[i];
							resGrades.push({
								'id': grade._id,
								'grade': grade.grade,
							});
						}
						console.log('Succeeded to get grades.');
                                                res.send({
						'status_code': 200,
						'syllabuses':resSyllabuses, 'grades': resGrades,
                                                });
					}
				});
			}]);
                };
                
		/*
		 * Parameter:
		 * 		password
		 * 		social_id
		 * 		registration_type
		 * 		registration_id
		 */
		// social signin authentication
		var socialSignin = function(req, res) {
			var password = req.param('social_id');
                        var data = {'social_id': req.param('social_id'),'social_type': req.param('social_type')};
                        console.log(data);
			async.waterfall([
            	function(cb) {
					UserModel.findOne({'social_id': req.param('social_id'),'social_type': req.param('social_type')}, function (err, user) {
                		 if(err) throw err;
                		 if (!err && user) {
							 /*//console.log('UserData:'+user);
								if (user.activation != '') {
									req.session.activationId = user._id;
									res.send({
										'status_code': 400,
										'message': 'Your account is not yet activated. Please check your email to complete registration.'
									});
								} else if (user.disabled === 'true') {
									res.send({
									'status_code': 400,
									'message': 'Sorry. Your account was suspended.'
								});
										
								} else {*/
									cb(null, user);
								//}
							} else {
								res.send({
									'status_code': 400,
									'message': 'Unable to sign in. User not registered.'
								});
							}
					});
				},
				function(user, cb) {
					TokenModel.remove({
						'userid': user._id,
						'registration_id': req.param('social_type')
					}, function(err, result) {
						cb(null, user);
					});
				},
				function(user, cb) {
					TokenModel.create({
						'userid': user._id,
						'registration_id': req.param('social_type')
					}, function(err, token, result) {
						if (err) {
							res.send({
								'status_code': 400,
								'message': 'Sorry. Something went wrong. Sign in was not successful. Please try again later.'
							});
						} else {
							cb(null, user, token._id);
						}
					});
				},
				function(user, token, cb) {
					UserModel.update({
						'_id': user._id
					}, {
						$set: {'logged': 'true', 'logged_date': new Date()}
					}, function(err, result) {
						if (err) {
							return res.send({
								'status_code': 400,
								'message': 'Sorry. Something went wrong. Sign in was not successful. Please try again later.'
							});
						}

						res.send({
							'status_code': 200,
							'message': 'Signed in successfully',
							'token': token
						});

						cb(null, user);
					});
				},
				function(user, cb) {
					// write log
					var logSchema = {
						'user': user._id,
						'type': 'sign in',
						'log': user.name + ' has signed in.',
					};

					LogModel.create(logSchema, function(err, log, result){});
				}
			]);
		}

	return {
		socialSignin:socialSignin,
		checkSignupParams: checkSignupParams,
		signup: signup,
        signin: signin,
		checkToken: checkToken,
        signout: signout,
		getProfile: getProfile,
		checkProfileParams: checkProfileParams,
		setProfile: setProfile,
		checkCurrentPasswordMatch: checkCurrentPasswordMatch,
        checkPasswordsMatch: checkPasswordsMatch,
		changePassword: changePassword,
		checkResetPasswordParams: checkResetPasswordParams,
		resetPassword: resetPassword,
		checkUpdateUsers: checkUpdateUsers,
		getTotalUsers: getTotalUsers,
		verifyEmail: verifyEmail,
		sendNotification: sendNotification,
		reportUser: reportUser,
		getInputSingup: getInputSingup,
	};
}();

module.exports = userApi;
