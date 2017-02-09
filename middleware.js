var express = require('express');
var fs = require('fs');
var UserModel = require('./models/users')
var passport = require('passport');

module.exports = function (app) {

    app.set('port', process.env.PORT || 3000);
    app.set('views', __dirname + '/views');
    app.set('view engine', 'jade');
    app.use(express.favicon());
    app.use(express.logger('short'));
    app.use(express.bodyParser({uploadDir: __dirname + '/tmp'}));
    app.use(express.methodOverride());
    app.use(express.cookieParser('afgvDFdshdrt547658udgdFDfhfdFSGfs'));
    app.use(express.session());
    app.use(function (req, res, next) {
	    res.locals.isCurrentPage = function (path) {
	      return req.path === path;
	    };

	    next();
	  });
	  app.use(function(req, res, next) {
	    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
	    res.setHeader("Pragma", "no-cache");
	    res.setHeader("Expires", "0");
	    return next();
	  });
	
	// Initialize Passport!  Also use passport.session() middleware, to support
	// persistent login sessions (recommended).
	app.use(passport.initialize());
	app.use(passport.session());
	
    /* Middleware to set session variable to view
     * The views can be access this session variable in templates
     * for checking user is logged in system.
     * */
    app.use(function (req, res, next) {
    	
    	

		if (req.session && !req.session.lesson) {
			req.session.lesson = {
				'isLesson': 'false',
				'syllabus':'',
				'grade': '',
				'chapter': '',
				'concept': '',
				'contents': 'video'
			};
		}

		if (req.session && !req.session.guest) {
			req.session.guest = {
				'name': 'Guest',
				'photo': ''
			};
		}

        if (req.session && req.session.user) {
			UserModel.findOne({'_id': req.session.user.id}, function(err, user) {
				if (err || !user || user.disabled === 'true') {
					delete req.session.user;
					res.clearCookie('remember');
				} else {
					res.locals.userid = req.session.user.id;
					res.locals.username = req.session.user.name;
					//changes done schoolname
					res.locals.schoolname = req.session.user.school_name;
					res.locals.gradename = req.session.user.grade;
					res.locals.syllabusname = req.session.user.syllabus;
					res.locals.usertype = (user.social_id == '' ? 'native' : 'social');

					//res.locals.logintype = req.user.provider;
					//**********************
					res.locals.user = req.session.user;
					//console.log(user.social_photo_url);
					//if (req.session.user.photo != '' && fs.existsSync(__dirname + '/files/' + req.session.user.photo))
					if (req.session.user.photo == '' || req.session.user.photo == 'undefined')
						res.locals.userphoto = "/images/guest.png";

					else 
						res.locals.userphoto = req.session.user.photo;
					/*						
					req.session.lesson = {
						'isLesson': 'false',
						'grade': user.grade,
						'syllabus': user.syllabus,
						'contents': 'video'
					};*/
					
					res.locals.lesson = req.session.lesson;
					res.locals.guest = req.session.guest;
				}

				next();
			});
		} else if (req.cookies && req.cookies.remember) {
			UserModel.findOne({'_id': req.cookies.remember.id}, function(err, user){
				if (!err && user && user.disabled === 'true'){
					res.clearCookie('remember');
				} else if (!err && user) {
					req.session.user = {
						'id': user._id,
						'name': user.name,
						'school_name': user.school_name,
						'syllabus': user.syllabus,
						'grade': user.grade,
						'section': user.section,
						'photo': user.photo,
						'usertype':(user.social_id == '' ? 'native' : 'social')
					};
					

					req.session.lesson = {
						'isLesson': 'false',
						'syllabus': user.syllabus,
						'grade': user.grade,
						'chapter': user.last_showed_chapter,
						'concept': user.last_showed_concept,
						'contents': 'video'
					};
					
					res.locals.userid = req.session.user.id;
					res.locals.username = req.session.user.name;
					res.locals.user = req.session.user;
					res.locals.usertype = req.session.user.usertype;
					//if (req.session.user.photo != '' && fs.existsSync(__dirname + '/files/' + req.session.user.photo))
					if (req.session.user.photo == '' || req.session.user.photo == undefined)
						res.locals.userphoto = "/images/guest.png";

					else 
						res.locals.userphoto = req.session.user.photo;

					res.locals.lesson = req.session.lesson;
					res.locals.guest = req.session.guest;
				}
				
				next();
			});
        } else {
			res.locals.lesson = req.session.lesson;
			res.locals.guest = req.session.guest;
			next();
		}
    });

	app.use(function (req, res, next) {
		if (   req.url === '/'
			|| req.url === '/accountactivation'
			|| req.url === '/grades'
			|| req.url === '/lessons'
			|| req.url === '/afterLogin'
			|| req.url === '/concept'
			|| req.url === '/contents'
			|| req.url === '/searchschools'
			|| req.url === '/searchvideo'
			|| req.url === '/getschools'
			|| req.url === '/getschool'
			|| req.url === '/autocomplete'
			|| req.url === '/getconcepts'
			|| req.url === '/getconcept'
			|| req.url === '/getvideos'
			|| req.url === '/getreferences'
			|| req.url === '/getnotes'
			|| req.url === '/searchcontents' 
			|| req.url.indexOf('/accountactivation/') === 0
			|| req.url.indexOf('/css/') === 0
			|| req.url.indexOf('/fonts/') === 0
			|| req.url.indexOf('/images') === 0
			|| req.url.indexOf('/js/') === 0
			|| req.url.indexOf('/imgs/') === 0
			|| req.url.indexOf('/users/') === 0
					|| req.url.indexOf('/admin/get/grades') === 0 ||
					req.url.indexOf('/admin/get/chapters') === 0 ||
					req.url.indexOf('/admin/get/concepts') === 0 ||
					req.url.indexOf('/admin/get/links') === 0
			|| req.url.indexOf('/api/') === 0 )
		{
			next();
			return;
		}

		if (req.url.indexOf('/admin') === 0) {
			if (req.session && req.session.admin) {
				res.locals.admin = 'true';
				if (req.url === '/admin' ||
					req.url === '/admin/discussions' ||
					req.url === '/admin/syllabuses' ||
					req.url === '/admin/syllabus/new' ||
					req.url === '/admin/grades' ||
					req.url === '/admin/grade/new' ||
					req.url === '/admin/chapters' ||
					req.url === '/admin/chapter/new' ||
					req.url === '/admin/concepts' ||
					req.url === '/admin/concept/new' ||
					req.url === '/admin/tests' ||
					req.url === '/admin/test/new' ||
					req.url === '/admin/logout' ||
					req.url === '/admin/reports' ||
					req.url === '/admin/users' ||
					req.url === '/admin/users/manage' ||
					req.url === '/admin/users/list' ||
					req.url === '/admin/logs' ||
					req.url === '/admin/monitoring' ||
					req.url === '/admin/contents/search' ||
					req.url === '/admin/contents/export' ||
					req.url === '/admin/tests/export-tests' ||
					req.url === '/admin/disable/user' ||
					req.url.indexOf('/admin/contents/import') === 0 ||
					req.url.indexOf('/admin/tests/import-tests') === 0 ||
					req.url.indexOf('/admin/tests/import/test') === 0 ||
					req.url.indexOf('/admin/search/users') === 0 ||
					req.url.indexOf('/admin/get/user') === 0 ||
					req.url.indexOf('/admin/download/users') === 0 ||
					req.url.indexOf('/admin/download/reports') === 0 ||
					req.url.indexOf('/admin/get/grades') === 0 ||
					req.url.indexOf('/admin/get/chapters') === 0 ||
					req.url.indexOf('/admin/get/concepts') === 0 ||
					req.url.indexOf('/admin/get/tests') === 0 ||
					req.url.indexOf('/admin/get/links') === 0 ||
					req.url.indexOf('/admin/get/discussions') === 0 ||
					req.url.indexOf('/admin/syllabus/edit') === 0 ||
					req.url.indexOf('/admin/syllabus/del') === 0 ||
					req.url.indexOf('/admin/grade/edit') === 0 ||
					req.url.indexOf('/admin/grade/del') === 0 ||
					req.url.indexOf('/admin/chapter/edit') === 0 ||
					req.url.indexOf('/admin/chapter/del') === 0 ||
					req.url.indexOf('/admin/test/edit') === 0 ||
					req.url.indexOf('/admin/test/del') === 0 ||
					req.url.indexOf('/admin/concept/edit') === 0 ||
					req.url.indexOf('/admin/discussion/del') === 0 ||
					req.url.indexOf('/admin/discussion/edit') === 0 ||
					req.url.indexOf('/admin/concept/del') === 0)
				{
					next();
				} else {
					res.redirect('/admin');
				}
			} else if (fs.existsSync(__dirname + '/files/config.json')) {
				if (req.url === '/admin/login')
					next();
				else
					res.redirect('/admin/login');
			} else {
				if (req.url === '/admin/register')
					next();
				else
					res.redirect('/admin/register');
			}

			return;
		}

		if ((req.session && req.session.user)
			&& ( req.url === '/signin'
			  || req.url === '/signup'
			  || req.url === '/forgotpassword'
			  || req.url === '/accountactivation'
			  || req.url === '/sendactivationlink'
			  || req.url.indexOf('/accountactivation/') === 0 )
		   )
		{
			return res.redirect('/');
		}

		if (!req.session || !req.session.user) {
			if ( req.url === '/signout'
				|| req.url === '/password'
				|| req.url === '/google'
				|| req.url === '/afterLogin'
				|| req.url === '/classmates'
				|| req.url === '/classmate'
				|| req.url === '/updates'
				|| req.url === '/get/classmates'
				|| req.url === '/get/classmate'
				|| req.url === '/get/grademates'
				|| req.url === '/get/friends'
				|| req.url === '/search/users'
				|| req.url === '/searchfriend'
				|| req.url === '/get/classmate/info'
				|| req.url === '/get/classmate/videos'
				|| req.url === '/get/classmate/references'
				|| req.url === '/get/classmate/notes'
				|| req.url === '/share/content'
				|| req.url === '/invite'
				|| req.url === '/set/update'
				|| req.url === '/add/friend'
				|| req.url === '/remove/friend'
				|| req.url === '/get/updates'
				|| req.url === '/get/updates/count'
				|| req.url === '/get/updates/unreadcount'
				|| req.url === '/read/update'
				|| req.url === '/report'
				|| req.url.indexOf('/profile') === 0 )
			{
				return res.redirect('/signin');
			}
			else if (req.url.indexOf('/addnote') === 0)
			{
				req.session.urlAfterLogin = '/lessons';
				return res.redirect('/signin');
			}
			else if (req.url === '/tests')
			{
				return res.redirect('/signin');
			}
			else if (req.url.indexOf('/addreference') === 0
				|| req.url.indexOf('/addvideo') === 0
				|| req.url.indexOf('/setdefault') === 0
				|| req.url.indexOf('/setprivate') === 0
				|| req.url.indexOf('/deletecontent') === 0 )
			{
				req.session.urlAfterLogin = '/contents';
				return res.redirect('/signin');
			}
		}

		next();
    });

    app.use(app.router);
    app.use(express.static(__dirname + '/public'));
    app.use(express.static(__dirname + '/files'));
	app.use(express.static(__dirname + '/tmp'));

    // development only
    if ('development' == app.get('env')) {
        console.log('development');
        app.use(express.errorHandler());
    }

	// create tmp, files directories
	fs.mkdir(__dirname + '/tmp', 0777, function(err) {});
	fs.mkdir(__dirname + '/files', 0777, function(err) {});
	fs.mkdir(__dirname + '/files/imgs', 0777, function(err) {});
	fs.mkdir(__dirname + '/files/users', 0777, function(err) {});
}
