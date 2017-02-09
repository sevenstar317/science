var IndexController = require('./controllers');
var IndexApiController = require('./controllers/index-api');
var UserController = require('./controllers/user');
var ClassmatesController = require('./controllers/classmates');
var UpdateController = require('./controllers/update');
var AdminController = require('./controllers/admin');
var UserApiController = require('./controllers/user-api');
var ContentApiController = require('./controllers/content-api');
var ClassmatesApiController = require('./controllers/classmates-api');
var TestApiController = require('./controllers/test-api');
var DiscussionsController = require('./controllers/discussions');
var passport = require('passport');

module.exports = function (app) {
    /* Normal Routes */
    app.get('/signup', [UserController.getGuestUser], UserController.renderSignupPage);
    app.post('/signup', [UserController.checkSignupParams], UserController.signup);
    app.get('/signin', [UserController.getGuestUser], UserController.renderSigninPage);
    app.post('/signin', UserController.signin);
    app.get('/signout', UserController.signout);
    app.get('/profile/view', UserController.renderProfileViewPage);
    app.get('/profile/edit', UserController.renderProfileEditPage);
    app.post('/profile', [UserController.checkProfileParams], UserController.saveProfile);
    app.get('/password', UserController.renderPasswordPage);
    app.post('/password',
            [
                UserController.findLoggedUser,
                UserController.checkCurrentPasswordMatch,
                UserController.checkPasswordsMatch
            ],
            UserController.password);
	app.get('/forgotpassword', [UserController.getGuestUser], UserController.renderForgotPasswordPage);
	app.post('/forgotpassword', [UserController.checkForgotPasswordParams], UserController.forgotPassword);
	app.get('/accountactivation', UserController.renderActivationPage);
	app.get('/accountactivation/:code', UserController.accountActivate);
	app.post('/sendactivationlink', UserController.sendActLink);
	app.get('/congratulations', UserController.renderCongratulationsPage);
	app.post('/report', UserController.reportUser);
	
	/* contents routes */
    app.get('/', IndexController.index);
    app.get('/myclass', IndexController.renderMyclassPage);
    app.get('/testsignup', IndexController.renderMytestsignup);
    app.get('/getdetails', IndexController.getDetails);
    app.get('/getPercentile', IndexController.getPercentile);
    app.get('/getPercentage', IndexController.getPercentage);
	app.get('/grades', [UserController.getGuestUser], IndexController.renderGradesPage);
	app.get('/lastlesson', IndexController.renderLastLessonPage);
	app.get('/lessons', [UserController.getGuestUser], IndexController.renderLessonsPage);
	app.get('/afterLogin',IndexController.renderAfterLoginPage);
	app.get('/google',IndexController.renderGooglePage);
	app.get('/concept', IndexController.renderConceptPage);
	app.get('/getHint',IndexController.getHint);
	app.get('/contents', IndexController.renderContentsRepositoryPage);
	app.get('/contents/videos', IndexController.renderContentsRepositoryPage);
	app.get('/contents/references', IndexController.renderContentsRepositoryPage);
	app.get('/contents/notes', IndexController.renderContentsRepositoryPage);
	
	app.get('/testSelection', IndexController.renderTest);

	app.get('/searchschools', IndexController.searchSchools);
	app.get('/getschools', IndexController.getSchools);
	app.get('/getschool', IndexController.getSchool);
	app.get('/autocomplete', IndexController.autocomplete);
	app.get('/getconcepts', IndexController.getConcepts);
	app.get('/getconcept',
			[
				IndexController.getConcept,
				IndexController.getDefaultVideo,
				IndexController.getDefaultReference,
				IndexController.getDefaultNote
			],
			IndexController.sendConcept);
	app.get('/getvideos', IndexController.getVideos);
	app.get('/getreferences', IndexController.getReferences);
	app.get('/getnotes', IndexController.getNotes);
	app.get('/getnotes2', IndexController.getNotes2);
	app.post('/setdefault', IndexController.setDefault);
	app.post('/setprivate', IndexController.setPrivate);
	app.post('/addnote', IndexController.addNote);
	app.get('/getConceptData', IndexController.getConceptData);
	app.post('/addreference', [IndexController.getDataFromRefUrl], IndexController.addReference);
	app.post('/addvideo', IndexController.addVideo);
	app.get('/searchvideo', IndexController.renderSearchVideoPage);
	app.get('/showconcept', IndexController.selectConcept);
	app.get('/changecontenttype', IndexController.changeContentType);
	app.post('/deletecontent', IndexController.deleteContent);
	app.get('/searchcontents', AdminController.searchContents);
	//app.get('/searchcontents', AdminController.searchContents);

	/* classmates routes */
	app.get('/classmates', ClassmatesController.renderClassmatesPage);
	app.get('/classmate', ClassmatesController.renderClassmatePage);
	app.get('/searchfriend', ClassmatesController.renderSearchFriendPage);
	/*               */
	app.get('/class_invite', ClassmatesController.renderClassInvitePage);
	
	app.get('/get/classmates', ClassmatesController.getClassmates);
	app.get('/get/grademates', ClassmatesController.getGrademates);
	app.get('/get/friends', ClassmatesController.getFriends);
	app.get('/get/classmate/info', ClassmatesController.getClassmateInfo);
	app.get('/search/users', ClassmatesController.searchUsers);
	app.get('/get/classmate/videos', ClassmatesController.getVideos);
	app.get('/get/classmate/references', ClassmatesController.getReferences);
	app.get('/get/classmate/notes', ClassmatesController.getNotes);
	app.post('/share/content', ClassmatesController.shareContent);
	app.post('/set/update', ClassmatesController.setUpdate);
	app.post('/invite', ClassmatesController.invite);
	app.post('/add/friend', ClassmatesController.addFriend);
	app.post('/remove/friend', ClassmatesController.removeFriend);

	/* updates routes */
	app.get('/updates', UpdateController.renderUpdatesPage);
	app.get('/get/updates/count', UpdateController.getUpdatesCount);
	app.get('/get/updates/unreadcount', UpdateController.getUnreadUpdatesCount);
	app.get('/get/updates', UpdateController.getUpdates);
	app.post('/read/update', UpdateController.readUpdate);

	/* admin routes */
	app.get('/admin', AdminController.renderAdminPage);

	app.get('/admin/discussions', AdminController.renderDiscussionsPage);
	app.get('/admin/get/discussions', AdminController.getDiscussions);
	app.get('/admin/discussion/del', AdminController.deleteDiscussion);
	app.get('/admin/discussion/edit', AdminController.renderDiscussionEditPage);
	app.post('/admin/discussion/edit', AdminController.editDiscussion);

	app.get('/admin/register', AdminController.renderRegisterPage);
	app.post('/admin/register', AdminController.register);
	app.get('/admin/login', AdminController.renderLoginPage);
	app.post('/admin/login', AdminController.login);
	app.get('/admin/logout', AdminController.logout);
	app.get('/admin/syllabuses', AdminController.renderSyllabusesPage);
	app.get('/admin/syllabus/new', AdminController.renderSyllabusNewPage);
	app.post('/admin/syllabus/new', AdminController.newSyllabus);
	app.get('/admin/syllabus/del', AdminController.deleteSyllabus);
	app.get('/admin/syllabus/edit', AdminController.renderSyllabusEditPage);
	app.post('/admin/syllabus/edit', AdminController.editSyllabus);
	app.get('/admin/grades', AdminController.renderGradesPage);
	app.get('/admin/grade/new', AdminController.renderGradeNewPage);
	app.post('/admin/grade/new', AdminController.newGrade);
	app.get('/admin/grade/del', AdminController.deleteGrade);
	app.get('/admin/grade/edit', AdminController.renderGradeEditPage);
	app.post('/admin/grade/edit', AdminController.editGrade);
	app.get('/admin/chapters', AdminController.renderChaptersPage);
	app.get('/admin/chapter/new', AdminController.renderChapterNewPage);
	app.post('/admin/chapter/new', AdminController.newChapter);
	app.get('/admin/chapter/del', AdminController.deleteChapter);
	app.get('/admin/chapter/edit', AdminController.renderChapterEditPage);
	app.post('/admin/chapter/edit', AdminController.editChapter);
	app.get('/admin/concepts', AdminController.renderConceptsPage);
	app.get('/admin/concept/new', AdminController.renderConceptNewPage);
	app.post('/admin/concept/new', [AdminController.getDataFromRefUrls], AdminController.newConcept);
	//app.post('/admin/concept/new', AdminController.newConcept);
	app.get('/admin/concept/del', AdminController.deleteConcept);
	app.get('/admin/concept/edit', AdminController.renderConceptEditPage);
	app.post('/admin/concept/edit', [AdminController.getDataFromRefUrls], AdminController.editConcept);
	//Tests
	app.get('/admin/tests', AdminController.renderTestsPage);
	app.get('/admin/test/new', AdminController.renderTestNewPage);
	app.post('/admin/test/new', AdminController.newTest);
	app.get('/admin/test/del', AdminController.deleteTest);
	app.get('/admin/test/edit', AdminController.renderTestEditPage);
	app.post('/admin/test/edit', AdminController.editTest);
	//
	app.get('/admin/contents/import', AdminController.renderImportContentsPage);
	//	app.post('/admin/contents/import', AdminController.importContents);
	app.post('/admin/contents/import/concept', AdminController.importConcepts);
	app.post('/admin/contents/import/mapping', AdminController.importMappings);
	app.get('/admin/contents/export', AdminController.renderExportContentsPage);
	app.post('/admin/contents/export', AdminController.exportContents);
	//Import Test
	app.get('/admin/tests/import-tests', AdminController.renderImportTestsPage);
	app.post('/admin/tests/import/test', AdminController.importTests);
	//app.post('/admin/tests/import/mapping', AdminController.importMappingsTest);	
	//Export Test
	app.get('/admin/tests/export-tests', AdminController.renderExportTestsPage);
	app.post('/admin/tests/export-tests', AdminController.exportTests);
	
	app.get('/admin/contents/search', AdminController.renderSearchContentsPage);
	app.get('/admin/reports', AdminController.renderReportsPage);
	app.get('/admin/users', AdminController.renderUsersPage);
	app.get('/admin/users/manage', AdminController.renderManageUsersPage);
	app.get('/admin/users/list', AdminController.renderListUsersPage);
	app.get('/admin/logs', AdminController.renderLogsPage);
	app.get('/admin/monitoring', AdminController.renderMonitoringPage);
	app.get('/admin/get/grades', AdminController.getGrades);
	app.get('/admin/get/chapters', AdminController.getChapters);
	app.get('/admin/get/concepts', AdminController.getConcepts);
	//Test Question list display
	app.get('/admin/get/tests', AdminController.getTests);
	//
	app.get('/admin/get/links', AdminController.getLinks);
	app.get('/admin/download/users', AdminController.downloadUsers);
	app.get('/admin/download/reports', AdminController.downloadReports);
	app.get('/admin/search/users', AdminController.searchUsers);
	app.get('/admin/get/user', AdminController.getUser);
	app.post('/admin/disable/user', AdminController.disableUser);



	/* User Apis for mobile */
    app.post('/api/signup', [UserApiController.checkSignupParams], UserApiController.signup);
    app.post('/api/signin', UserApiController.signin);
    app.get('/api/getInputSingup', UserApiController.getInputSingup);
    //social api for signin
    app.post('/api/socialSignin', UserApiController.socialSignin);
    app.post('/api/signout', [UserApiController.checkToken], UserApiController.signout);
    app.post('/api/profile/get', [UserApiController.checkToken], UserApiController.getProfile);
    app.post('/api/profile/set', 
			[
				UserApiController.checkToken,
				UserApiController.checkProfileParams
			], 
			UserApiController.setProfile);
    app.post('/api/password/change', 
			 [
			 	UserApiController.checkToken,
				UserApiController.checkCurrentPasswordMatch,
                                UserApiController.checkPasswordsMatch
			 ], 
			 UserApiController.changePassword);
	app.post('/api/password/reset', [UserApiController.checkResetPasswordParams], UserApiController.resetPassword);
	app.post('/api/get/user/total', [UserApiController.checkUpdateUsers], UserApiController.getTotalUsers);
	app.post('/api/email/verification', UserApiController.verifyEmail);
	app.post('/api/report', [UserApiController.checkToken], UserApiController.reportUser);

	/* Content Apis for mobile */
	app.post('/api/content/add/video', [UserApiController.checkToken], ContentApiController.addVideo);
	app.post('/api/content/add/reference', 
			 [
			 	UserApiController.checkToken, 
				IndexController.getDataFromRefUrl
			 ],
			 ContentApiController.addReference);
	app.post('/api/content/add/note', [UserApiController.checkToken], ContentApiController.addNote);
	app.post('/api/content/set/default', [UserApiController.checkToken], ContentApiController.setDefault);
	app.post('/api/content/set/private', [UserApiController.checkToken], ContentApiController.setPrivate);
	app.post('/api/get/link', [ContentApiController.checkUpdateLinks], ContentApiController.getLinks);
	app.post('/api/get/syllabus/total', ContentApiController.getTotalSyllabuses);
	app.post('/api/get/grade/total', ContentApiController.getTotalGrades);
//	app.post('/api/get/chapter/total', ContentApiController.getTotalChapters);
	app.post('/api/get/chapters', [ContentApiController.checkUpdateChapters], ContentApiController.getChapters);
//	app.post('/api/get/concept/total', [ContentApiController.checkUpdateConcepts], ContentApiController.getTotalConcepts);
	app.post('/api/get/concepts', [ContentApiController.checkUpdateConcepts], ContentApiController.getConcepts);
	app.post('/api/get/video/total', 
				[ContentApiController.checkUpdateVideos], 
				ContentApiController.getTotalVideos);
	app.post('/api/get/video/chapter', 
				[ContentApiController.checkUpdateVideosOfChapter], 
				ContentApiController.getTotalVideosOfChapter);
	app.post('/api/get/video/concept', 
				[ContentApiController.checkUpdateVideosOfConcept], 
				ContentApiController.getTotalVideosOfConcept);
	app.post('/api/get/reference/total', 
				[ContentApiController.checkUpdateReferences], 
				ContentApiController.getTotalReferences);
	app.post('/api/get/reference/chapter', 
				[ContentApiController.checkUpdateReferencesOfChapter], 
				ContentApiController.getTotalReferencesOfChapter);
	app.post('/api/get/reference/concept', 
				[ContentApiController.checkUpdateReferencesOfConcept], 
				ContentApiController.getTotalReferencesOfConcept);
	app.post('/api/get/note/total', 
				[ContentApiController.checkUpdateNotes], 
				ContentApiController.getTotalNotes);
	app.post('/api/get/note/chapter', 
				[ContentApiController.checkUpdateNotesOfChapter], 
				ContentApiController.getTotalNotesOfChapter);
	app.post('/api/get/note/concept', 
				[ContentApiController.checkUpdateNotesOfConcept], 
				ContentApiController.getTotalNotesOfConcept);
	app.post('/api/deletecontent', [ContentApiController.checkToken], ContentApiController.deleteContent);

	/* Classmate Apis for mobile */
	app.post('/api/share/content', [UserApiController.checkToken], ClassmatesApiController.shareContent);
	app.post('/api/set/update', [UserApiController.checkToken], ClassmatesApiController.setUpdate);
	app.post('/api/invite', [UserApiController.checkToken], ClassmatesApiController.invite);
	app.post('/api/add/friend', [UserApiController.checkToken], ClassmatesApiController.addFriend);
	app.post('/api/remove/friend', [UserApiController.checkToken], ClassmatesApiController.removeFriend);
	app.post('/api/get/updates/total', [UserApiController.checkToken], ClassmatesApiController.getTotalUpdates);
        app.post('/api/get/classmates', [UserApiController.checkToken], ClassmatesApiController.getClassmates);
	
	
		/* facebook login */

	// GET /auth/facebook
	//   Use passport.authenticate() as route middleware to authenticate the
	//   request.  The first step in Facebook authentication will involve
	//   redirecting the user to facebook.com.  After authorization, Facebook will
	//   redirect the user back to this application at /auth/facebook/callback
	app.get('/auth/facebook',
	  passport.authenticate('facebook',  { scope: ['user_friends', 'public_profile', 'basic_info'] }),
	  function(req, res){
	  	//  console.log(req);
		// The request will be redirected to Facebook for authentication, so this
		// function will not be called.
	  });
	
	// GET /auth/facebook/callback
	//   Use passport.authenticate() as route middleware to authenticate the
	//   request.  If authentication fails, the user will be redirected back to the
	//   login page.  Otherwise, the primary route function function will be called,
	//   which, in this example, will redirect the user to the home page.
	
	
	app.get('/auth/facebook/callback', 
		passport.authenticate('facebook', { failureRedirect: '/login' }),UserController.socialSignin
		
	);
	
	// GET /auth/google
	//   Use passport.authenticate() as route middleware to authenticate the
	//   request.  The first step in Google authentication will involve
	//   redirecting the user to google.com.  After authorization, Google
	//   will redirect the user back to this application at /auth/google/callback
	app.get('/auth/google',
		passport.authenticate('google', { scope: ['https://www.googleapis.com/auth/plus.login','email'] }),
		function(req, res){
		// The request will be redirected to Google for authentication, so this
		// function will not be called.
	});

	// GET /auth/google/callback
	//   Use passport.authenticate() as route middleware to authenticate the
	//   request.  If authentication fails, the user will be redirected back to the
	//   login page.  Otherwise, the primary route function function will be called,
	//   which, in this example, will redirect the user to the home page.
	app.get('/auth/google/callback', 
		passport.authenticate('google', { failureRedirect: '/login' }),UserController.socialSignin
	);
	
	// destroy session on simple signup
	app.post('/social-logout',function(req,res) { 
		req.session.destroy(function(err) {
			console.log(err);
		});
	})
	
	// website test page
	app.get('/tests', IndexController.renderTestsPage);
	
	// get test page
	app.get('/test-list', IndexController.getTests);
	app.get('/test', IndexController.getTestsList);
	app.get('/reviewanswer', IndexController.getReviewAnswerList);
	
	/* Test Apis for mobile */
	app.post('/api/test/getTests', [UserApiController.checkToken], TestApiController.getTests);
	app.post('/api/test/getTestsList', [UserApiController.checkToken], TestApiController.getTestsList);
	app.post('/api/test/saveTestScore', TestApiController.saveTestScore);
	app.post('/api/test/getHint', TestApiController.getHint);
	app.post('/api/test/getPercentage', TestApiController.getPercentage);
	app.post('/api/test/getPercentile', TestApiController.getPercentile);
//        Get Board
	app.post('/api/getBoard', [UserApiController.checkToken], IndexApiController.getBoard);
	app.post('/api/getConcepts', IndexApiController.getConcepts);
	app.post('/api/getConcept', IndexApiController.getConcept);
        app.get('/api/syllabuses', IndexApiController.getSyllabuses);
        app.post('/api/grades', IndexApiController.getGrades);
        app.post('/api/chapers', IndexApiController.getChapers);
        
    app.post('/api/test/getCategoriesTest', [UserApiController.checkToken], TestApiController.getCategoriesTest);
    app.post('/api/test/getSubCategories', [UserApiController.checkToken], TestApiController.getSubCategories);
	app.get('/group-tests', IndexController.getGroupTestsList);
	app.post('/save-test-user', IndexController.saveTestScore);

	app.post('/api/links', [UserApiController.checkToken], IndexApiController.getLinks);

	// discussions routes
	app.get('/get/discussions', DiscussionsController.getDiscussions);
	app.get('/get/user/:userid', DiscussionsController.getUser);
	app.post('/create/discussion', DiscussionsController.createDiscussion);
	app.post('/create/response', DiscussionsController.createDiscussionResponse);
	app.post('/create/response/response', DiscussionsController.respondToResponse);
	app.post('/vote/response', DiscussionsController.voteResponse);
	app.post('/vote/discussion', DiscussionsController.voteDiscussion);
	app.get('/discussion/:discussion', IndexController.renderDiscussionPage);
//        Api disscuss
        app.post('/api/discussions', [UserApiController.checkToken], IndexApiController.getDiscussions);
        app.post('/api/create/discussion', [UserApiController.checkToken], IndexApiController.createDiscussion);
        app.post('/api/discussion/:discussion',  [UserApiController.checkToken], IndexApiController.renderDiscussionPage);
        app.post('/api/create/response', [UserApiController.checkToken], IndexApiController.createDiscussionResponse);

}


