/*
 * User Controller
 * @Author zuogong
 */

var user = function () {
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
			pass: 'funisscience'
		}
	});

	var actCodeLength = 20;

    var UserModel = require('../models/users'),
		SyllabusModel = require('../models/syllabus'),
		GradeModel = require('../models/grades'),
		UpdateModel = require('../models/updates'),
		ReportModel = require('../models/reports'),
		LogModel = require('../models/logs'),
		LogModel = require('../models/logs'),
		LinkModel = require('../models/links'),
		TestScoremodel = require('../models/testscore'),
		Common = require('./common'),
		logger = require('tracer').colorConsole(),
		path = require('path'),

		renderSignupPage = function (req, res) {
			
			if (typeof  req.user !== 'undefined') {			
				var len = Object.keys(req.user._json).length;
			}
			var social_user_info = '';
			if(len) {
				if(req.user.emails) {
					var socialEmail = req.user.emails[0].value;
				}
				else {
					var socialEmail = "";
				}
				if(req.user.photos) {
					var photos = req.user.photos[0].value;
				}
				else {
					var photos = "";
				}
				social_user_info =  {'email' : socialEmail, 'displayName' : req.user.displayName, 'id' : req.user.id, 'type' : req.user.provider, 'photos' : photos};
			}
			else {
				social_user_info = '';
			}
			
			async.waterfall([
			function(cb) {
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
						res.render('signup', {'syllabuses':resSyllabuses, 'grades': resGrades, 'social_user' : social_user_info});
					}
				});
			}
			]);
        },
		/*
		 * params: name
		 *       : email
		 *       : password
		 *       : confirm-password
		 *       : school-name
		 *       : school-addr
		 *       : school-city
		 *       : school-postalcode
		 *       : school-country
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

			if (req.param('password') != req.param('confirm-password')) {
				return res.send({
					'status_code': 400,
					'message': 'Passwords do not match.'
				});
			}

			if (!req.param('school-name') || req.param('school-name') == ''){
				return res.send({
					'status_code': 400,
					'message': 'Please enter the name of your school.'
				});
			}

			if (!req.param('syllabus') || req.param('syllabus') == ''){
				return res.send({
					'status_code': 400,
					'message': 'Please select your syllabus.'
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
		 *       : confirm-password
		 *       : school-name
		 *       : school-addr
		 *       : school-city
		 *       : school-postalcode
		 *       : school-country
		 *       : syllabus
		 *       : grade
		 *       : section
		 *       : photo (image data)
		 */
        signup = function (req, res) {
			var password = req.param('password');
			var rootPath = __dirname.substring(0, __dirname.lastIndexOf('/'));
						
				var schema = {
				'name': req.param('name'),
                'email': req.param('email'),
				'password': '',
				'school_name': req.param('school-name'),
				'school_addr': req.param('school-addr'),
				'school_city': req.param('school-city'),
				'school_postalcode': req.param('school-postalcode'),
				'school_country': req.param('school-country'),
				'syllabus': req.param('syllabus'),
				'grade': req.param('grade'),
				'section': req.param('section'),
				'photo': (req.param('social-image') == ''?'':req.param('social-image')),
				'update_on_users': [],
				'social_id': req.param('social-id'),
				'social_type': req.param('registration-type'),
				'activation': (req.param('social-id') == ''?utils.randomString(actCodeLength):'')
            	};

			async.waterfall([
				function(cb) {
					UserModel.find({
						'school_name': req.param('school-name'),
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
					if(req.param('social-id') != ""){
						cb(null);
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

							res.send({
								'status_code': 400,
								'message': message
							});
                    	} else {
							var filename = path.join(path.dirname(require.main.filename), '/files/users/', user._id + '.png');
							
							if(req.param('social-id') == "" || req.param('photo') != ""){
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


								UserModel.update({'_id': user._id}, {'photo': schema.photo}, function(error, doc) {
									if (error && schema.photo != '') {
										UserModel.remove({'_id':user._id}, null);

										if (fs.existsSync(filename))
											fs.unlinkSync(filename);

										res.send({
											'status_code': 400,
											'message': 'Sorry. Something went wrong. Image upload was not successful. Please try again later.'
										});
									} else {
										cb(null, user);
									}
								});
							} else {

								UserModel.update({'_id': user._id}, {'photo': schema.photo}, function(error, doc) {
									if (error && schema.photo != '') {
										UserModel.remove({'_id':user._id}, null);

										if (fs.existsSync(filename))
											fs.unlinkSync(filename);

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
					if(req.param('social-id') == ''){

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
								'status_code': 201,
								'message': 'Account activated.'
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
							return res.send({
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
						cb(null, user);
					});
				}
			]);	
        },
        renderSigninPage = function (req, res) {
            res.render('signin');
        },
		/*
		 * params: email
		 *       : password
		 */
        signin = function (req, res) {
			var password = req.param('password');
			async.waterfall([
            	function(cb) {
					UserModel.findOne({'email': req.param('email')}, function (err, user) {
                		if (!err && user) {
							if (user.activation != '') {
								req.session.activationId = user._id;
								res.send({
									'status_code': 400,
									'message': 'Your account is not yet activated. Please check your email to complete registration.',
									'redirect': '/accountactivation'
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
							var url = '/';
							if (req.session.urlAfterLogin) {
								url = req.session.urlAfterLogin;
								delete req.session.urlAfterLogin;
							}

							if (req.session.lesson.grade != user.grade) {
								req.session.lesson.syllabus = user.syllabus;
								req.session.lesson.grade = user.grade;
								req.session.lesson.chapter = user.last_showed_chapter;
								req.session.lesson.concept = user.last_showed_concept;
								url = '/';
							} else {
								UserModel.update({'_id': user._id}, 
									{
										'last_showed_chapter': req.session.lesson.chapter,
										'last_showed_concept': req.session.lesson.concept
									}, 
									function(err, user1) {
										if (err)
											console.log('Failed to remember last read concept.');
										else
											console.log('Succeeded to remember last read concept.');
									}
								);
							}

							cb(null, user, url);
						} else {
							res.send({
								'status_code': 400,
								'message': 'Unable to sign in. Either your email or the password is wrong. Please try again.'
							});
						}
					});
				},
				function(user, url, cb) {
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

						req.session.user = {
							'id': user._id,
							'name': user.name,
							'school_name': user.school_name,
							'syllabus': user.syllabus,
							'grade': user.grade,
							'section': user.section,
							'photo': user.photo,
							'registration_type':''
						};

						res.cookie('remember', req.session.user, { path: '/', httpOnly: true, maxAge: 864000 });
						res.send({
							'status_code': 200,
							'message': 'Signed in successfully',
							'redirect': '/myclass'
						});

						cb(null);
					});
				},
				function(cb) {
					// write log
					var logSchema = {
						'user': req.session.user.id,
						'type': 'sign in',
						'log': req.session.user.name + ' has signed in.',
					};

					LogModel.create(logSchema, function(err, log, result){});
				}
			]);
        },
        signout = function (req, res) {
			async.waterfall([
			function(cb) {
				UserModel.update({
					'_id': req.session.user.id
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
						'user': req.session.user.id,
						'type': 'sign out',
						'log': req.session.user.name + ' has signed out.'
					};
					LogModel.create(logSchema, function(err, log, result){});

					// delete user information
					if (req.session && req.session.user) {
						delete req.session.user;
            		}
					res.clearCookie('remember');
					req.session.lesson = {
						'isLesson': 'false',
						'syllabus': '',
						'grade': '',
						'chapter': '',
						'concept': '',
						'contents': 'video'
					};

					req.session.concept = {
						'syllabus': '',
						'grade': '',
						'chapter': '',
						'concept': ''
					};
					//Added New
					req.session.destroy(function(err) {
						console.log(err);
					});
					//+++++++++
					res.redirect('/signin');
				});
			}]);
        },
        renderProfileViewPage = function (req, res) {
			UserModel.findOne({ _id: req.session.user.id }, function (err, user) {
				var profile = {
					'name': '',
					'email': '',
					'school_name': '',
					'school_addr': '',
					'school_city': '',
					'school_postalcode': '',
					'school_country': '',
					'syllabus': '--',
					'grade': '',
					'section': '',
					'photo': '',
					'percentage': 0,
					'classmates': 0
				};

                if (!err && user) {
                	profile.name = user.name;
					profile.email = user.email;
					profile.school_name = user.school_name;
					profile.school_addr = user.school_addr;
					profile.school_city = user.school_city;
					profile.school_postalcode = user.school_postalcode;
					profile.school_country = user.school_country;
					profile.section = user.section;
					if (req.session.user.photo != '') {
						profile.photo = req.session.user.photo;
					}/*
					else {
						
						if(req.session.user.social_type == 'facebook'){
							profile.photo = user.facebook_photo;
						} else {
							profile.photo = user.google_photo;
						}						
					}*/

				}

				async.waterfall([
					function(cb) {
						SyllabusModel.findOne({'_id':user.syllabus}, function(err1, syllabus){
							if (!err1 && syllabus)
								profile.syllabus = syllabus.title;

							cb(null);
						});
					},

					function(cb){
						var percentage = 0;
						var testlen= 0;
						var totaltest= 0;
						var percentageInfo = [];
						var userid = user.id;
						var grade = user.grade;
						var syllabus = user.syllabus;
						var id=0;
				    var resT;

				    LinkModel.find({'kind':'test','grade':grade,'syllabus':syllabus},function (err,tests){
				    	if(err) throw err;

				    	TestScoremodel.find({'user':userid},function (err, testscore){
				    		if(err||!testscore||testscore.length===0) {
				    			console.log('Did not get score');
				    			profile.percentage = 0;
				    		} else {
									//profile.percentage = Math.floor((testscore.length/(tests.length/6))*100);
									profile.percentage = (testscore.length / Math.floor(tests.length / 6)) * 100;
				    		}
				    		cb(null);
				    	});
				    });
				},

				function (cb) {
					UserModel.find({
						'_id': {$in: user.update_on_users},
						'school_name': user.school_name,
						'grade': user.grade,
						'section': user.section
					}, function(err, classmates) {
						/*if (err || !classmates || classmates.length <= 0) {
							return res.send({
								'status_code': 200,
								'message': 'Almost there. We sent you an email to verify your account. Please check your email to complete registration.',
								'userid': user._id
							});
						}*/
						profile.classmates = classmates;
						cb(null);
					});
				},

				function(cb) {
					GradeModel.findOne({'_id':user.grade}, function(err1, grade){
						if (!err1 && grade)
							profile.grade = grade.grade;
		
						res.render('profile', {'profile': profile});
					});
				}
				]);
			});
		},
		renderProfileEditPage = function (req, res) {
			UserModel.findOne({ _id: req.session.user.id }, function (err, user) {
				var profile = {
					'name': '',
					'email': '',
					'school_name': '',
					'school_addr': '',
					'school_city': '',
					'school_postalcode': '',
					'school_country': '',
					'syllabus': '',
					'syllabus_label': 'Syllabus',
					'grade': '',
					'grade_label': 'Grade',
					'section': '',
					'photo': ''
				};

                if (!err && user) {
					profile.name = user.name;
					profile.email = user.email;
					profile.school_name = user.school_name;
					profile.school_addr = user.school_addr;
					profile.school_city = user.school_city;
					profile.school_postalcode = user.school_postalcode;
					profile.school_country = user.school_country;
					profile.syllabus = user.syllabus;
					profile.grade = user.grade;
					profile.section = user.section;
					if (req.session.user.photo != '') {
						profile.photo = user.photo;
					}
					else {
						profile.photo = user.social_photo_url;
					}
				}

				async.waterfall([
				function(cb) {
					var resSyllabuses = [];

					SyllabusModel.find({}, {}, {sort: {'order':1}}, function(err, syllabuses){
						if (err || !syllabuses || syllabuses.length <= 0) {
							console.log('Failed to get syllabuses.');
							cb(null, resSyllabuses);
						} else {
							var len = syllabuses.length;
		
							for (var i = 0; i < len; i++) {
								var syllabus = syllabuses[i];
								if (syllabus._id == user.syllabus)
									profile.syllabus_label = syllabus.title;
		
								resSyllabuses.push({
									'id': syllabus._id,
									'title': syllabus.title,
								});
							}
		
							console.log('Succeeded to get grades.');
							cb(null, resSyllabuses);
						}
					});
				},
				function(resSyllabuses, cb) {
					GradeModel.find({}, {}, {sort: {'date':1}}, function(err, grades){
						if (err || !grades || grades.length <= 0) {
							console.log('Failed to get grades.');
							res.render('profile-edit', {'profile': profile, 'syllabuses':resSyllabuses, 'grades':[]})
						} else {
							var len = grades.length;
							var resGrades = [];
		
							for (var i = 0; i < len; i++) {
								var grade = grades[i];
								if (grade._id == user.grade)
									profile.grade_label = grade.grade;
		
								resGrades.push({
									'id': grade._id,
									'grade': grade.grade,
								});
							}
		
							console.log('Succeeded to get grades.');
							res.render('profile-edit', {'profile': profile, 'syllabuses':resSyllabuses, 'grades':resGrades});
						}
					});
				}
				]);
			});
		},
		/*
		 * params: name
		 *       : school-name
		 *       : school-addr
		 *       : school-city
		 *       : school-postalcode
		 *       : school-country
		 *       : grade
		 *       : section
		 *       : photo (image data)
		 *       : phto-removed
		 */
		checkProfileParams = function (req, res, next) {
			if (!req.param('name') || req.param('name') == ''){
				return res.send({
					'status_code': 400,
					'message': 'Please enter your name.'
				});
			}

			if (!req.param('school-name') || req.param('school-name') == ''){
				return res.send({
					'status_code': 400,
					'message': 'Please enter the name of your school.'
				});
			}

			if (!req.param('syllabus') || req.param('syllabus') == ''){
				return res.send({
					'status_code': 400,
					'message': 'Please select your syllabus.'
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
		 *       : school-name
		 *       : school-addr
		 *       : school-city
		 *       : school-postalcode
		 *       : school-country
		 *       : grade
		 *       : section
		 *       : photo (image data)
		 *       : phto-removed
		 */
        saveProfile = function (req, res) {
            var updateSchema = {
              'name': req.param('name'),
							'school_name': req.param('school-name'),
							'school_addr': req.param('school-addr'),
							'school_city': req.param('school-city'),
							'school_postalcode': req.param('school-postalcode'),
							'school_country': req.param('school-country'),
							'syllabus': req.param('syllabus'),
							'grade': req.param('grade'),
							'section': req.param('section'),
							'photo': req.session.user.photo,
							'updated_date': new Date()
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

			var rootPath = path.dirname(require.main.filename);

			if (req.param('photo-removed') == 'removed') {
				updateSchema.photo = '';
			}

			async.waterfall([
				function(cb) {
					if (req.param('password') && (req.param('password') !== '') && (req.param('password').length >= 6)) {
						bcrypt.genSalt(10, function (err, salt) {
							if(err){
								res.send({
									'status_code': 400,
									'message': 'Password encryption failed.'
								});
							}else{
								cb(null, salt);
							}
						});
					} else {
						cb(null, null);
					}
				},
				function(salt, cb) {
					if (salt) {
						bcrypt.hash(req.param('password'), salt, function (err, hash) {
							if(err){
								res.send({
									'status_code': 400,
									'message': 'Password encryption failed.'
								});
							}else{
								updateSchema.password = hash;
								cb(null);
							}
						});
					} else {
						cb(null);
					}
				},
			function(cb) {
				if (req.param('photo')) {
					var filename = rootPath + '/files/users/' + req.session.user.id + '.png';
					var buf = req.param('photo');
					buf = buf.replace(/^data:image\/\w+;base64,/, "");
					buf = new Buffer(buf, 'base64');
					fs.writeFileSync(filename, buf);

					if (fs.existsSync(filename))
						updateSchema.photo = '/users/' + req.session.user.id + '.png';
					else {
						console.log('Failed to upload photo.');
						return res.send({
							'status_code': 400,
							'message': 'Sorry. Something went wrong. Image upload was not successful. Please try again later..'
						});
					}
				}

				cb(null);
			},
			function(cb) {
            	UserModel.update({ '_id': req.session.user.id }, updateSchema, function (e, resultSet) {
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
						res.send({
							'status_code': 400,
							'message': message
						});
                    } else {
						if (req.param('photo-removed') == 'removed') {
							if (req.session.user.photo != ''
								&& fs.existsSync(rootPath + '/files' + req.session.user.photo))
							{
								fs.unlinkSync(rootPath + '/files' + req.session.user.photo);
							}
						}

						req.session.lesson.syllabus = updateSchema.syllabus;
						req.session.lesson.grade = updateSchema.grade;
						req.session.lesson.chapter = '';
						req.session.lesson.concept = '';

						cb(null); 
                    }
                });
			},
			function(cb) {
				var logSchema = {
					'user': req.session.user.id,
					'type': 'change profile',
					'log': req.session.user.name + ' has changed the profile.'
				};

				LogModel.create(logSchema, function(err, log, result){});
				cb(null);
			},
			function(cb){
				if (req.session.user.school_name == updateSchema.school_name &&
					req.session.user.grade == updateSchema.grade &&
					req.session.user.section == updateSchema.section)
				{
					req.session.user.name = updateSchema.name;
					req.session.user.photo = updateSchema.photo;
					req.session.user.school_name = updateSchema.school_name;
					req.session.user.syllabus = updateSchema.syllabus;
					req.session.user.grade = updateSchema.grade;
					req.session.user.section = updateSchema.section;

					console.log('Succeeded to update profile.');
					return res.send({
						'status_code': 200,
						'message': 'Your profile was updated successfully.',
						'photo': updateSchema.photo
					});
				}

				UserModel.update({
					'_id': {$ne: req.session.user.id},
					'school_name': req.session.user.school_name,
					'grade': req.session.user.grade
				}, {
					$pull: {'update_on_users': req.session.user.id}
				}, {
					multi: true
				}, function(err, result) {
					UserModel.update({
						'_id': {$ne: req.session.user.id},
						'school_name': updateSchema.school_name,
						'grade': updateSchema.grade,
					}, {
						$push: {'update_on_users': req.session.user.id}
					}, {
						multi:true
					}, function(err1, result1) {
						cb(null);
					});
				});
			},
			function(cb){
				UserModel.findOne({'_id': req.session.user.id}, function(err, user){
					if (err || !user){
						req.session.user.name = updateSchema.name;
						req.session.user.photo = updateSchema.photo;
						req.session.user.school_name = updateSchema.school_name;
						req.session.user.syllabus = updateSchema.syllabus;
						req.session.user.grade = updateSchema.grade;
						req.session.user.section = updateSchema.section;

						console.log('Succeeded to update profile.');
						return res.send({
							'status_code': 200,
							'message': 'Your profile was updated successfully.',
							'photo': updateSchema.photo
						});
					}

					cb(null, user);
				});
			},
			function(user, cb) {
				UserModel.find({
					'_id': {$ne: req.session.user.id},
					$or: [
						{
							'school_name': req.session.user.school_name,
							'grade': req.session.user.grade
						},
						{
							'school_name': updateSchema.school_name,
							'grade': updateSchema.grade
						}
					]
				}, function(err, users) {
					if (err || !users) {
						req.session.user.name = updateSchema.name;
						req.session.user.photo = updateSchema.photo;
						req.session.user.school_name = updateSchema.school_name;
						req.session.user.syllabus = updateSchema.syllabus;
						req.session.user.grade = updateSchema.grade;
						req.session.user.section = updateSchema.section;

						console.log('Succeeded to update profile.');
						return res.send({
							'status_code': 200,
							'message': 'Your profile was updated successfully.',
							'photo': updateSchema.photo
						});
					}

					var len = users.length;
					for (var i = 0; i < len; i++) {
						if (users[i].school_name == updateSchema.school_name &&
								 users[i].grade == updateSchema.grade)
						{
							user.update_on_users.pull(users[i]._id);
							user.update_on_users.push(users[i]._id);
						}
						else if (users[i].school_name == req.session.user.school_name &&
							users[i].grade == req.session.user.grade)
						{
							user.update_on_users.pull(users[i]._id);
						}
					}

					cb(null, user);
				});
			},
			function(user, cb) {
				UserModel.update({
					'_id': req.session.user.id
				}, {
					'update_on_users': user.update_on_users
				}, function(err, result){
					cb(null, user);
				});
			},
			function(user, cb){
				GradeModel.findOne({'_id': user.grade}, function(err, grade){
					if (err || !grade) {
						req.session.user.name = updateSchema.name;
						req.session.user.photo = updateSchema.photo;
						req.session.user.school_name = updateSchema.school_name;
						req.session.user.syllabus = updateSchema.syllabus;
						req.session.user.grade = updateSchema.grade;
						req.session.user.section = updateSchema.section;

						console.log('Succeeded to update profile.');
						return res.send({
							'status_code': 200,
							'message': 'Your profile was updated successfully.',
							'photo': updateSchema.photo
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
						req.session.user.name = updateSchema.name;
						req.session.user.photo = updateSchema.photo;
						req.session.user.school_name = updateSchema.school_name;
						req.session.user.syllabus = updateSchema.syllabus;
						req.session.user.grade = updateSchema.grade;
						req.session.user.section = updateSchema.section;

						console.log('Succeeded to update profile.');
						return res.send({
							'status_code': 200,
							'message': 'Your profile was updated successfully.',
							'photo': updateSchema.photo
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
					req.session.user.name = updateSchema.name;
					req.session.user.photo = updateSchema.photo;
					req.session.user.school_name = updateSchema.school_name;
					req.session.user.syllabus = updateSchema.syllabus;
					req.session.user.grade = updateSchema.grade;
					req.session.user.section = updateSchema.section;

					console.log('Succeeded to update profile.');
					res.send({
						'status_code': 200,
						'message': 'Your profile was updated successfully.',
						'photo': updateSchema.photo
					});

					sendNotification(update_on_users, update.text);
				});
			}]);
        },
		renderPasswordPage = function (req, res) {
            res.render('password');
        },
        /* First middleware method for route "app.post('/password', ..."  */   
        findLoggedUser = function (req, res, next) {
            req.loggedUser = null;

            var condition = { '_id': req.session.user.id };
            UserModel.findOne(condition, '_id password', function(e, user) {
                if(!e && user) {
                    req.loggedUser = user;
                } else {
                    return res.send({
						'status_code': 400,
						'message': "Sorry. This user is not registered." 
					});
                }
                next();
            });

        },
        /* Second middleware method for route "app.post('/password', ..."  */
        checkCurrentPasswordMatch = function (req, res, next) {
            req.checkCurrentPasswordMatch = false;
			bcrypt.compare(req.param('old-password'), req.loggedUser.password, function (error, auth) {
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
            if (req.param('new-password') == req.param('confirm-password')) {
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
		 * params: old-password
		 *       : new-password
		 *       : confirm-password
		 */
        changePassword = function (req, res) {
			var pass = req.param('new-password');
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
					UserModel.update({ '_id': req.loggedUser._id }, {'password': hash}, function (err, resultSet) {
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
						'user': req.session.user.id,
						'type': 'change password',
						'log': req.session.user.name + ' has changed the password.'
					};

					LogModel.create(logSchema, function(err, log, result){});
				}
			]);
        },
		renderForgotPasswordPage = function (req, res) {
            res.render('forgotPassword');
        },
		/*
		 * params: email
		 */
		checkForgotPasswordParams = function (req, res, next) {
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
		forgotPassword = function (req, res) {
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
					UserModel.findOne({'email': mail_address,'social_id':''},function(err,user){
						if(err) throw err;
						if(user){
							var userID = user._id;
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
					var userid = 'ObjectId(\''+userID+'\')';
					
					UserModel.update({'_id': userID}, {'password': hash}, function(err, doc){				

						if (!err && doc) {
							var html = '<p>Hi,</p>';
							html += '<p>Your password has been reset. Please sign in using this:</p>';
							html += '<p style="color:#00F">' + newPass + '</p>';
							html += '<p>If you need help, please contact the site administrator(<a href="mailto:admin@scienceisfun.in">admin@scienceisfun.in</a>).</p>';

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
									console.log(error);
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
		renderActivationPage = function (req, res) {
			res.render(
				'accountactivation',
				{'activationId': req.session.activationId}
			);
		},
		accountActivate = function (req, res) {
			var code = req.params.code;
			var actCode = code.substr(0, actCodeLength);
			var userid = code.substr(actCodeLength, code.length - actCodeLength);

			async.waterfall([
			function(cb) {
				UserModel.findOne({
   					'_id': userid,
					'activation': actCode
				}, function (err, user) {
					if (!err && user) {
						cb(null, user);
					} else {
						res.render('accountactivation');
					}
				});
			},
			function(user, cb) {
				UserModel.update({
					'_id': userid
				}, {
					'activation': '',
					$set: {'logged': 'true', 'logged_date': new Date()}
				}, function(err, result){
					if (err) {
						res.render('accountactivation');
					} else {
						req.session.user = {
							'id': user._id,
							'name': user.name,
							'school_name': user.school_name,
							'syllabus': user.syllabus,
							'grade': user.grade,
							'section': user.section,
							'photo': user.photo
						};
						res.cookie('remember', req.session.user, { path: '/', httpOnly: true, maxAge: 864000 });
						res.redirect('/congratulations');
						cb(null);
					}
				});
			},
			function(cb) {
				// write log
				var logSchema = {
					'user': req.session.user.id,
					'type': 'verify',
					'log': req.session.user.name + ' has verified.',
				};

				LogModel.create(logSchema, function(err, log, result){});
			}]);
		},
		renderCongratulationsPage = function (req, res) {
            res.render('congratulations');
        },
		sendActLink = function (req, res) {
			var actCode = utils.randomString(actCodeLength);
			var query;
			if (req.param('email')) {
				query = {'email': req.param('email')};
			} else if (req.param('userid')) {
				query = {'_id': req.param('userid')};
			} else {
				console.log('Failed to resend activation code.');
				return res.send({
					'status_code': 400,
					'message': 'Please enter your email address or account id.'
				});
			}

			async.waterfall([
			function(cb) {
				UserModel.update(query, {'activation': actCode}, function (err, result){
					if (err) {
						console.log('Failed to resend activation link.');
						return res.send({
							'status_code': 400,
							'message': 'Sorry. Something went wrong. Activation link resend was not successful. Please try again later.'
						});
					}

					cb(null);
				});
			},
			function(cb) {
				UserModel.findOne(query, function(err, user) {
					if (err || !user) {
						console.log('Failed to resend activation link.');
						return res.send({
							'status_code': 400,
							'message': 'Sorry. Something went wrong. Activation link resend was not successful. Please try again later.'
						});
					}

					var link = 'http://' + req.get('host') + '/accountactivation/' + user.activation + user._id;
					var html = '<p>Hi ' + user.name + ',</p>';
					html += '<p>To confirm your new account, please go to this web address:</p>';
					html += '<a href="' + link + '">' + link + '</a>';
					html += '<p style="margin-top:10px">In most mail programs, this should appear as a blue link which you can just click on.<br>';
					html += 'If that doesn\'t work, then cut and paste the address into the address line at the top of your web browser window.</p>';
					html += '<p>If you need help, please contact the site administrator(<a href="mailto:admin@scienceisfun.in">admin@scienceisfun.in</a>).</p>';
					
					var mailOptions = {
    					from: fromMailAddress,
    					to: user.email,
    					subject: 'Account Activation',
    					text: 'Account Activation',
    					html: html
					};

					transporter.sendMail(mailOptions, function(error, info){
						if (error) {
							console.log('Failed to resend activation link.');
							res.send({
								'status_code': 400,
								'message': 'Sorry. Something went wrong. Activation link resend was not successful. Please try again later.'
							});
						} else {
							console.log('Succeeded to resend activation link.');

							delete req.session.activationId;
							res.send({
								'status_code': 200,
								'message': 'Activation link was resend successfully.',
								'userid': user._id
							});

							cb(null, user);
						}
					});
				});
			},
			function(user, cb) {
				var logSchema = {
					'user': user._id,
					'type': 'resend activation link',
					'log': user.name + ' has resent activation link.'
				};

				LogModel.create(logSchema, function(err, log, result){});
			}]);
		},
		getGuestUser = function (req, res, next) {
			if (req.session.guest && req.session.guest.name != 'Guest') {
			}
			else {
				var lstScientists = Common.getScientists();
				var scientist = lstScientists[0];
		
				req.session.guest.name = scientist.name;
				req.session.guest.photo = scientist.photo;
			}

			next();
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
				var TokenModel = require('../models/tokens');
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
					'reporter': req.session.user.id
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
						'reporter': req.session.user.id
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
						'reporter': req.session.user.id,
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
						'user': req.session.user.id,
						'type': 'report',
						'log': req.session.user.name + ' has reported ' + user.name + '.',
						'content': report_id
					};

					LogModel.create(logSchema, function(err, log, result){});
				});
			}]);
		};
		
		// social signin error template
		renderSocialSigninPage = function (req, res) {
            res.render('soical-signin-error');
        }
		
		// social signin authentication
		var socialSignin = function(req, res) {
			async.waterfall([
            	function(cb) {
					UserModel.findOne({'social_id': req.user.id}, function (err, user) {
                		 if (err)
							return done(err);
						
							if (!err && user) {
								if (user.disabled === 'true') {
									
									res.redirect('/social/signin');
									
								} else {
									cb(null, user);
								}
							} else {
								
								console.log('user not found');
								res.redirect('/signup?type=social');
								
							}
						
					});
				},
				function(user, cb) {
							var url = '/';
							if (req.session.urlAfterLogin) {
								url = req.session.urlAfterLogin;
								delete req.session.urlAfterLogin;
							}

							if (req.session.lesson.grade != user.grade) {
								req.session.lesson.syllabus = user.syllabus;
								req.session.lesson.grade = user.grade;
								req.session.lesson.chapter = user.last_showed_chapter;
								req.session.lesson.concept = user.last_showed_concept;
								url = '/';
							} else {
								UserModel.update({'_id': user._id}, 
									{
										'last_showed_chapter': req.session.lesson.chapter,
										'last_showed_concept': req.session.lesson.concept
									}, 
									function(err, user1) {
										if (err)
											console.log('Failed to remember last read concept.');
										else
											console.log('Succeeded to remember last read concept.');
									});
							}

							cb(null, user, url);
						 
				
				},
				function(user, url, cb) {
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

						req.session.user = {
							'id': user._id,
							'name': user.name,
							'school_name': user.school_name,
							'syllabus': user.syllabus,
							'grade': user.grade,
							'section': user.section,
							'photo': user.photo,
							'registration_type':'social'
						};

						res.cookie('remember', req.session.user, { path: '/', httpOnly: true, maxAge: 864000 });
						res.redirect('/');
						cb(null);
					});
				},
				function(cb) {
					// write log
					var logSchema = {
						'user': req.session.user.id,
						'type': 'sign in',
						'log': req.session.user.name + ' has signed in.',
					};

					LogModel.create(logSchema, function(err, log, result){});
				}
			]);
		}
		/*
		var facebookSignin = function(req, res) {
			var password = req.user.id;
			async.waterfall([
            	function(cb) {
					UserModel.findOne({'facebook_id': req.user.id}, function (err, user) {
                		 if (err)
							return done(err);
						
							if (!err && user) {
								if (user.activation != '') {
									req.session.activationId = user._id;
									res.redirect('/accountactivation');
								} else if (user.disabled === 'true') {									
									res.redirect('/social/signin');									
								} else {
									cb(null, user);
								}
							} else {
								console.log('user not found');
								UserModel.findOne({'email': req.user.emails[0].value}, function (err, user) {
										if(err) throw err;
										if(user){

											UserModel.update({'_id': user._id}, {$set: {'facebook_id': req.user.id, 'facebook_photo': req.user.photos[0].value}},function(err,result){
												if(err) {
													throw err;
												} else {
														cb(null, result);
													}
											});
										} else {

											res.redirect('/signup?type=social');	

										}											
									});							
							}
						
					});
				},
				function(user, cb) {
					
					if(user.facebook_id != ''){
						var url = '/';
							if (req.session.urlAfterLogin) {
								url = req.session.urlAfterLogin;
								delete req.session.urlAfterLogin;
							}

							if (req.session.lesson.grade != user.grade) {
								req.session.lesson.syllabus = user.syllabus;
								req.session.lesson.grade = user.grade;
								req.session.lesson.chapter = user.last_showed_chapter;
								req.session.lesson.concept = user.last_showed_concept;
								url = '/';
							} else {
								UserModel.update({'_id': user._id}, 
									{
										'last_showed_chapter': req.session.lesson.chapter,
										'last_showed_concept': req.session.lesson.concept
									}, 
									function(err, user1) {
										if (err)
											console.log('Failed to remember last read concept.');
										else
											console.log('Succeeded to remember last read concept.');
									}
								);
							}
							cb(null, user, url);
					} else {
						bcrypt.compare(password, user.password, function (err, auth) {
						if (!err && auth) {
							var url = '/';
							if (req.session.urlAfterLogin) {
								url = req.session.urlAfterLogin;
								delete req.session.urlAfterLogin;
							}

							if (req.session.lesson.grade != user.grade) {
								req.session.lesson.syllabus = user.syllabus;
								req.session.lesson.grade = user.grade;
								req.session.lesson.chapter = user.last_showed_chapter;
								req.session.lesson.concept = user.last_showed_concept;
								url = '/';
							} else {
								UserModel.update({'_id': user._id}, 
									{
										'last_showed_chapter': req.session.lesson.chapter,
										'last_showed_concept': req.session.lesson.concept
									}, 
									function(err, user1) {
										if (err)
											console.log('Failed to remember last read concept.');
										else
											console.log('Succeeded to remember last read concept.');
									}
								);
							}

							cb(null, user, url);
						} else {
							res.send({
								'status_code': 400,
								'message': 'Unable to sign in. Either your email or the password is wrong. Please try again.'
							});
						}
					});
					}
					
				},
				function(user, url, cb) {
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

						req.session.user = {
							'id': user._id,
							'name': user.name,
							'school_name': user.school_name,
							'syllabus': user.syllabus,
							'grade': user.grade,
							'section': user.section,
							'photo': user.facebook_photo,
							'social_type':'facebook'
						};

						res.cookie('remember', req.session.user, { path: '/', httpOnly: true, maxAge: 864000 });
						res.redirect('/');
						cb(null);
					});
				},
				function(cb) {
					// write log
					var logSchema = {
						'user': req.session.user.id,
						'type': 'sign in',
						'log': req.session.user.name + ' has signed in.',
					};

					LogModel.create(logSchema, function(err, log, result){});
				}
			]);
		}
		// social signin authentication
		var googleSignin = function(req, res) {
			var password = req.user.id;
			async.waterfall([
            	function(cb) {
					UserModel.findOne({'google_id': req.user.id}, function (err, user) {
                		 if (err)
							return done(err);
						
							if (!err && user) {
								if (user.activation != '') {
									req.session.activationId = user._id;
									res.redirect('/accountactivation');
								} else if (user.disabled === 'true') {
									
									res.redirect('/social/signin');
									
								} else {
									cb(null, user);
								}
							} else {
								
								UserModel.findOne({'email': req.user.emails[0].value}, function (err, user) {
										if(err) throw err;
										if(user){

											UserModel.update({'_id': user._id}, {$set: {'google_id': req.user.id, 'google_photo': req.user.photos[0].value}},function(err,result){
												if(err) {
													throw err;
												} else {
														cb(null, result);
													}
											});
										} else {

											res.redirect('/signup?type=social');	

										}											
									});		
								
							}
						
					});
				},
				function(user, cb) {
					if(user.google_id != ''){
						var url = '/afterLogin';
							if (req.session.urlAfterLogin) {
								url = req.session.urlAfterLogin;
								delete req.session.urlAfterLogin;
							}

							if (req.session.lesson.grade != user.grade) {
								req.session.lesson.syllabus = user.syllabus;
								req.session.lesson.grade = user.grade;
								req.session.lesson.chapter = user.last_showed_chapter;
								req.session.lesson.concept = user.last_showed_concept;
								url = '/';
							} else {
								UserModel.update({'_id': user._id}, 
									{
										'last_showed_chapter': req.session.lesson.chapter,
										'last_showed_concept': req.session.lesson.concept
									}, 
									function(err, user1) {
										if (err)
											console.log('Failed to remember last read concept.');
										else
											console.log('Succeeded to remember last read concept.');
									}
								);
							}
							cb(null, user, url);
					} else {
						bcrypt.compare(password, user.password, function (err, auth) {
						if (!err && auth) {
							var url = '/';
							if (req.session.urlAfterLogin) {
								url = req.session.urlAfterLogin;
								delete req.session.urlAfterLogin;
							}

							if (req.session.lesson.grade != user.grade) {
								req.session.lesson.syllabus = user.syllabus;
								req.session.lesson.grade = user.grade;
								req.session.lesson.chapter = user.last_showed_chapter;
								req.session.lesson.concept = user.last_showed_concept;
								url = '/';
							} else {
								UserModel.update({'_id': user._id}, 
									{
										'last_showed_chapter': req.session.lesson.chapter,
										'last_showed_concept': req.session.lesson.concept
									}, 
									function(err, user1) {
										if (err)
											console.log('Failed to remember last read concept.');
										else
											console.log('Succeeded to remember last read concept.');
									}
								);
							}

							cb(null, user, url);
						} else {
							res.send({
								'status_code': 400,
								'message': 'Unable to sign in. Either your email or the password is wrong. Please try again.'
							});
						}
					});
					}
				},
				function(user, url, cb) {
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

						req.session.user = {
							'id': user._id,
							'name': user.name,
							'school_name': user.school_name,
							'syllabus': user.syllabus,
							'grade': user.grade,
							'section': user.section,
							'photo': user.google_photo,
							'social_type':'google'
						};

						res.cookie('remember', req.session.user, { path: '/afterLogin', httpOnly: true, maxAge: 864000 });
						res.redirect('/');
						cb(null);
					});
				},
				function(cb) {
					// write log
					var logSchema = {
						'user': req.session.user.id,
						'type': 'sign in',
						'log': req.session.user.name + ' has signed in.',
					};

					LogModel.create(logSchema, function(err, log, result){});
				}
			]);
		}
*/
		
		

    return {
		renderSignupPage: renderSignupPage,
		checkSignupParams: checkSignupParams,
        signup: signup,
        renderSigninPage: renderSigninPage,
        signin: signin,
        signout: signout,
        renderProfileViewPage: renderProfileViewPage,
		renderProfileEditPage: renderProfileEditPage,
		checkProfileParams: checkProfileParams,
        saveProfile: saveProfile,
		renderPasswordPage: renderPasswordPage,
        findLoggedUser: findLoggedUser,
        checkCurrentPasswordMatch: checkCurrentPasswordMatch,
        checkPasswordsMatch: checkPasswordsMatch,
        password: changePassword,
		renderForgotPasswordPage: renderForgotPasswordPage,
		checkForgotPasswordParams: checkForgotPasswordParams,
		forgotPassword: forgotPassword,
		renderActivationPage: renderActivationPage,
		accountActivate: accountActivate,
		renderCongratulationsPage: renderCongratulationsPage,
		sendActLink: sendActLink,
		getGuestUser: getGuestUser,
		sendNotification: sendNotification,
		reportUser: reportUser,
		socialSignin: socialSignin,
		//facebookSignin: facebookSignin,
		//googleSignin:googleSignin,
		renderSocialSigninPage: renderSocialSigninPage
		
    };
}();

module.exports = user;
