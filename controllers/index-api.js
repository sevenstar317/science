/*
 * Index Api Controller
 * @Author Thanh Le
 */

var indexApi = function () {

    var fbgraph = require('fbgraphapi');
    var newfbgraph = require('fbgraph');
    var facebook = require('./social-friend-list');
    var googleapis = require('googleapis');
    var DiscussionsController = require('./discussions');
    var UserApiController = require('./user-api');
    var UserModel = require('../models/users'),
            DiscussionModel = require('../models/discussion'),
            SyllabusModel = require('../models/syllabus'),
            GradeModel = require('../models/grades'),
            ChapterModel = require('../models/chapters'),
            ConceptModel = require('../models/concepts'),
            TestModel = require('../models/tests'),
            VideoModel = require('../models/videos'),
            ReferenceModel = require('../models/references'),
            NoteModel = require('../models/notes'),
            UpdateModel = require('../models/updates'),
            LogModel = require('../models/logs'),
            LinkModel = require('../models/links'),
            TestScoremodel = require('../models/testscore'),
            DiscussionResponseModel = require('../models/discussionResponse'),
            ObjectId = require('mongodb').ObjectID,
            dateFormat = require('dateformat'),
            utils = require('../utils'),
            Common = require('./common'),
            async = require('async'),
            request = require('request'),
            logger = require('tracer').colorConsole(),
            google_key = 'AIzaSyCijF8bxiN85ZflIllbtrCXdG5RkUbwZXc',
            fromMailAddress = 'no-reply@scienceisfun.in',
            nodemailer = require('nodemailer'),
            transporter = nodemailer.createTransport({
                service: 'Gmail',
                connectionTimeout: 90000,
                auth: {
                    user: 'scienceisfun01@gmail.com',
                    pass: 'romi2345'
                }
            }),
            googleapis = require('googleapis'),
            plus = googleapis.plus('v1'),
            OAuth2 = googleapis.auth.OAuth2,
            oauth2Client = new OAuth2('25626773198-ldeub2pae5rjgk7hjlpt68jb0ppevmn6.apps.googleusercontent.com', 'GaoG2DDSbZ3R3NYW-fJQwSJa', 'http://scienceisfun.mobiloitte.org:3000/auth/google/callback');



    getBoard = function (req, res) {


        var chapterIds = [];
        var resChapters = [];
        async.waterfall([
            function (cb) {
                LinkModel.find({
                    'kind': 'chapter',
                    'syllabus': req.user.syllabus,
                    'grade': req.user.grade
                }, {}, {sort: {'order': 1}}, function (err, links) {
                    if (err || !links) {
                        console.log('Failed to get chapters.');
                        return res.send({
                            'status_code': 400,
                            'message': 'Failed to get chapters.'
                        });
                    } else {
                        var len = links.length;
                        console.log(len);
                        for (var i = 0; i < len; i++) {
                            chapterIds.push(links[i].chapter);
                        }
                        cb(null);
                    }
                });
            },
            function (cb) {
                ChapterModel.find({'_id': {$in: chapterIds}/*'grade': req.session.lesson.grade*/, 'enabled': {$ne: 'false'}},
                {}, {sort: {'order': 1}}, function (err, chapters) {
                    if (err || !chapters || chapters.length <= 0) {
                        console.log('Failed to get chapters.');
                        return res.send({
                            'status_code': 400,
                            'message': 'Failed to get chapters.'
                        });
                    } else {
                        var len = chapters.length;

                        for (var i = 0; i < len; i++) {
                            var chapter = chapters[i];
                            resChapters.push({
                                'id': chapter._id,
                                'title': utils.convertHtmlTagToSpecialChar(chapter.title)
                            });
                        }



                        console.log('Succeeded to get chpaters.');
                        cb(null);
                    }
                });
            },
            function (cb) {
                res.send({
                    'status_code': 200,
                    'message': 'Succeeded to get chpaters.',
                    'chapters': resChapters,
                });
            }
        ]);
    },
    getChapers = function (req, res) {

        var chapterIds = [];
        var resChapters = [];
        async.waterfall([
            function (cb) {
                LinkModel.find({
                    'kind': 'chapter',
                    'syllabus': req.param("syllabus"),
                    'grade': req.param("grade"),
                }, {}, {sort: {'order': 1}}, function (err, links) {
                    if (err || !links) {
                        console.log('Failed to get chapters.');
                        return res.send({
                            'status_code': 400,
                            'message': 'Failed to get chapters.'
                        });
                    } else {
                        var len = links.length;
                        console.log(len);
                        for (var i = 0; i < len; i++) {
                            chapterIds.push(links[i].chapter);
                        }
                        cb(null);
                    }
                });
            },
            function (cb) {
                ChapterModel.find({'_id': {$in: chapterIds}/*'grade': req.session.lesson.grade*/, 'enabled': {$ne: 'false'}},
                {}, {sort: {'order': 1}}, function (err, chapters) {
                    if (err || !chapters || chapters.length <= 0) {
                        console.log('Failed to get chapters.');
                        return res.send({
                            'status_code': 400,
                            'message': 'Failed to get chapters.'
                        });
                    } else {
                        var len = chapters.length;

                        for (var i = 0; i < len; i++) {
                            var chapter = chapters[i];
                            resChapters.push({
                                'id': chapter._id,
                                'title': utils.convertHtmlTagToSpecialChar(chapter.title)
                            });
                        }



                        console.log('Succeeded to get chpaters.');
                        cb(null);
                    }
                });
            },
            function (cb) {
                res.send({
                    'status_code': 200,
                    'message': 'Succeeded to get chpaters.',
                    'chapters': resChapters,
                });
            }
        ]);
    },
    /*
    * param: chapter_id
    */
    getConcepts = function (req, res) {
        var chaperId = "";
        console.log(req.param('chapter_id'));
        if (!req.param('chapter_id') || req.param('chapter_id') == '') {
            return res.send({
                'status_code': 400,
                'message': 'Please enter the chapter id.'
            });
        }
        else{
            chaperId = req.param('chapter_id');
        }


        var conceptIds = [];
        var resConcepts = [];

        async.waterfall([
            function (cb) {
                LinkModel.find({
                    'kind': 'concept',
//                    'syllabus': req.user.syllabus,
//                    'grade': req.user.grade,
                    'chapter': chaperId
                }, {}, {sort: {'order': 1}}, function (err, links) {
                    if (err || !links || links.length <= 0) {
                        console.log('Failed to get concepts.');
                        res.send({
                            'status_code': 400,
                            'message': 'Concepts not found.',
                        });
                    } else {
                        var len = links.length;
                        for (var i = 0; i < len; i++) {
                            conceptIds.push(links[i].concept);
                        }
                        cb(null);
                    }
                });
            },
            function (cb) {
                var len = conceptIds.length;
                var cnt = 0;

                for (var j = 0; j < len; j++) {
                    var conceptId = conceptIds[j];

                    ConceptModel.findOne({
                        '_id': conceptId,
                        'enabled': {$ne: 'false'}
                    }, function (err, concept) {
                        cnt++;
                        if (err || !concept) {
                            console.log('Failed to get concept: ' + conceptId);
                            /*res.send({
                             'status_code': 400,
                             'message': 'Concepts not found.',
                             });*/
                        } else {
                            resConcepts.push({
                                'id': concept._id,
                                'title': utils.convertHtmlTagToSpecialChar(concept.title),
                                'image': concept.image,
                                'image_source': concept.image_source,
                                'image_credit': concept.image_credit,
                                'image2': concept.image2,
                                'image2_source': concept.image2_source,
                                'image2_credit': concept.image2_credit
                            });
                        }

                        if (cnt >= len) {
                            cb(null);
                        }
                    });
                }
            },
            function (cb) {
                console.log('Succeeded to get concepts.');
                res.send({
                    'status_code': 200,
                    'message': 'Concepts were got successfully.',
                    'concepts': resConcepts
                });
            }
        ]);

    },
    /*
     * param: concept_id
     */
    getConcept = function(req, res, next) {
            if (!req.param('concept_id') || req.param('concept_id') == '') {
                    return res.send({
                            'status_code': 400,
                            'message': 'Please enter the concept id.'
                    });
            }
            async.waterfall(
            [
                function(cb){
                    VideoModel.findOne({'concept': req.param('concept_id')}, function(err, video){
                        if (err || !video) {
                            return res.send({
                                    'status_code': 400,
                                    'message': 'Video not found.',
                            });
                        }
                        else{
                            cb(null, video)
                        }
                    });
                },
                function (video, cb) {
                    ConceptModel.findOne({'_id': req.param('concept_id')}, function(err, concept){
                            if (err || !concept) {
                                    return res.send({
                                            'status_code': 400,
                                            'message': 'Concepts not found.',
                                    });
                            }

                            res.send({
                                'status_code': 200,
                                'message': 'Concepts were got successfully.',
                                'concept': {
                                    'id': concept._id,
                                    'title': utils.convertHtmlTagToSpecialChar(concept.title),
                                    'text': utils.convertHtmlTagToSpecialChar(concept.text),
                                    'image': concept.image,
                                    'image_source': concept.image_source,
                                    'image_credit': concept.image_credit,
                                    'image2': concept.image2,
                                    'image2_source': concept.image2_source,
                                    'image2_credit': concept.image2_credit
                                },
                                'video':{
                                   id : video._id,
                                   url : video.url,
                                   
                                }
                            });

                    });
                }
            ]);

    },
    /*
     * param: 
     * 
     */
    getLinks = function(req, res) {
        
        var kind = req.param('kind');
        var syllabus_id = req.param('syllabus');
        var grade_id = req.param('grade');
        var chapter_id = req.param('chapter');
        var concept_id = req.param('concept');

        var query;

        var gradeNames = [];
        var chapterNames = [];
        var conceptNames = [];
        var testNames = [];

        if (!kind) {
            console.log('Failed to get links.');
            return res.send({
                'status_code': 400,
                'message': 'Please enter the kind of link.'
            });
        }

        if (kind === 'grade') {
            if (!syllabus_id) {
                console.log('Failed to get links.');
                return res.send({
                    'status_code': 400,
                    'message': 'Please enter the syllabus id.Grade'
                });
            }

            query = {
                'kind': kind,
                'syllabus': syllabus_id
            };
            
        }
        else if (kind === 'chapter') {
            if (!syllabus_id || !grade_id) {
                console.log('Failed to get links.');
                return res.send({
                    'status_code': 400,
                    'message': 'Please enter the syllabus id.Chapter'
                });
            }

            query = {
                'kind': kind,
                'syllabus': syllabus_id,
                'grade': grade_id
            };
        }
        else if (kind === 'concept') {
            if (!syllabus_id || !grade_id || !chapter_id) {
                console.log('Failed to get links.');
                return res.send({
                    'status_code': 400,
                    'message': 'Please enter the syllabus id.Concept'
                });
            }

            query = {
                'kind': kind,
                'syllabus': syllabus_id,
                'grade': grade_id,
                'chapter': chapter_id
            };
        }
        else if (kind === 'test') {
            if (!syllabus_id || !grade_id || !chapter_id || !concept_id) {
                console.log('Failed to get links.');
                return res.send({
                    'status_code': 400,
                    'message': 'Please enter the syllabus id.Test'
                });
            }

            query = {
                'kind': kind,
                'syllabus': syllabus_id,
                'grade': grade_id,
                'chapter': chapter_id,
                'concept': concept_id
            };
        }
        else {
            console.log('Failed to get links.');
            return res.send({
                'status_code': 400,
                'message': 'Please enter the kind of link.'
            });
        }

        async.waterfall([
        function(cb) {
            GradeModel.find({}, function(err, grades){
            
                if (err || !grades || grades.length <= 0) {
                    console.log('Failed to get grade name list.');
                    res.send({
                        'status_code': 400,
                        'message': 'Sorry. Something went wrong. Please try again later.'
                    });
                } else {
                    var len = grades.length;
                    for (var i = 0; i < len; i++) {
                        var grade = grades[i];
                        gradeNames[grade._id] = grade.grade;
                    }
                    cb(null);
                }
            });
        },
        
        function(cb) {
            ChapterModel.find({}, function(err, chapters){
                if (err || !chapters || chapters.length <= 0) {
                    console.log('Failed to get chapter name list.');
                    res.send({
                        'status_code': 400,
                        'message': 'Sorry. Something went wrong. Please try again later.'
                    });
                } else {
                    var len = chapters.length;
                    for (var i = 0; i < len; i++) {
                        var chapter = chapters[i];
                        chapterNames[chapter._id] = chapter.title;
                    }
                    cb(null);
                }
            });
        },
        function(cb) {
            ConceptModel.find({}, function(err, concepts){
                if (err || !concepts || concepts.length <= 0) {
                    console.log('Failed to get concept name list.');
                    res.send({
                        'status_code': 400,
                        'message': 'Sorry. Something went wrong. Please try again later.'
                    });
                } else {
                    var len = concepts.length;
                    for (var i = 0; i < len; i++) {
                        var concept = concepts[i];
                        conceptNames[concept._id] = concept.title;
                    }
                    cb(null);
                }
            });
        },
        function(cb) {
            TestModel.find({}, function(err, tests){
                if (err || !tests || tests.length <= 0) {
                    console.log('Failed to get question name list.');
                    res.send({
                        'status_code': 400,
                        'message': 'Sorry. Something went wrong. Please try again later.'
                    });
                } else {
                    var len = tests.length;
                    for (var i = 0; i < len; i++) {
                        var test = tests[i];
                        testNames[test._id] = test.question;
                    }
                    cb(null);
                }
            });
        },
        
        function(cb) {
            LinkModel.find(
                query,
            {
            }, {
                sort: {'order': 1}
            }, function(err, links){
                if (err || !links) {
                    console.log('Failed to get links.');
                    res.send({
                        'status_code': 400,
                        'message': 'Sorry. Something went wrong. Please try again later.'
                    });
                } else {
                    cb(null, links);
                }
            });
        },
        
        function(links, cb) {
            var resLinks = [];
            var len = links.length;
            console.log(len);
            for (var i = 0; i < len; i++) {
                var linkInfo = links[i];
                if (kind === 'grade') {
                    resLinks.push({
                        'order': linkInfo.order,
                        'grade_id': linkInfo.grade,
                        'grade_title': gradeNames[linkInfo.grade]
                    });
                } else if (kind === 'chapter') {
                    resLinks.push({
                        'order': linkInfo.order,
                        'chapter_id': linkInfo.chapter,
                        'chapter_title': chapterNames[linkInfo.chapter]
                    });
                } else if (kind === 'concept') {
                    resLinks.push({
                        'order': linkInfo.order,
                        'concept_id': linkInfo.concept,
                        'concept_title': conceptNames[linkInfo.concept]
                    });
                } else if (kind === 'test') {
                    resLinks.push({
                        'order': linkInfo.order,
                        'test_id': linkInfo.test,
                        'test_title': testNames[linkInfo.test]
                    });
                }   
            }

            console.log('Succeeded to get links.');
            res.send({
                'status_code': 200,
                'links': resLinks
            });
        }
        ]);
    },
    getSyllabuses = function (req, res) {

        SyllabusModel.find({
            'enabled': {$ne: 'false'}
        }, {
            'title': 1,
            'order': 1
        }, {
            sort: {'order': 1}
        }, function (err, syllabuses) {
            if (err || !syllabuses || syllabuses.length <= 0) {
                console.log('Failed to get grades.');
                return res.send(
                    {
                        'status_code': 400,
                        'message': 'Failed to get grades.'
                    }
                );
            } else {
                //cb(null, syllabuses);
                console.log('Succeeded to get grades.');
                return res.send({
                    'status_code': 200,
                    'message' : 'Succeeded to get grades.',
                    'syllabuses': syllabuses
                });
            }
        });
    },
    /*
     * param :	option
     * syllabus
     */
    getGrades = function (req, res) {

        var option = "mapped";
        var syllabusId = req.param('syllabus');


        var grades = [];

        if (option === 'all') {
        }
        else if (option === 'mapped') {
            if (!syllabusId) {
                console.log('Failed to get grades.');
                return res.send({
                    'status_code': 400,
                    'message': 'Please enter the option.'
                });
            }
        }
        else if (option === 'unmapped') {
        }
        else {
            console.log('Failed to get grades.');
            return res.send({
                'status_code': 400,
                'message': 'Please enter the option.'
            });
        }

        async.waterfall([
            function (cb) {
                if (option === 'all') {
                    getGradeListAllUnmapped('true', grades, function () {
                        cb(null, grades);
                    });
                }
                else if (option === 'mapped') {
                    getGradeListMapped(syllabusId, grades, function () {
                        cb(null, grades);
                    });
                }
                else if (option === 'unmapped') {
                    getGradeListAllUnmapped2('false', grades, function () {
                        console.log(grades);
                        cb(null, grades);
                    });
                }
            },
            function (grades, cb) {
                cb(null, grades);
            },
            function (grades, cb) {
                if (!grades)
                    grades = [];

                console.log('Succeeded to get grades.');

                return res.send({
                    'status_code': 200,
                    'option': option,
                    'grades': grades
                });

            }

        ]);
    },
    getGradeListMapped = function (syllabusId, retGrades, callback) {
        tmp_grades = [];

        async.waterfall([
            function (cb) {
                SyllabusModel.findOne({
                    '_id': syllabusId
                }, function (err, syllabus) {
                    if (err || !syllabus) {
                        retGrades = null;

                        if (callback)
                            callback();
                        return;
                    } else {
                        cb(null, syllabus);
                    }
                });
            },
            function (syllabus, cb) {
                var gradeIds = [];
                LinkModel.find({
                    'kind': 'grade',
                    'syllabus': syllabusId
                }, {
                    'grade': 1
                }, /*{
                 sort:{'order': 1}
                 },*/ function (err, links) {
                    if (err || !links) {
                        retGrades = null;
                        if (callback)
                            callback();
                        return;
                    } else {
                        var len = links.length;
                        for (var i = 0; i < len; i++) {
                            gradeIds.push(links[i].grade);
                        }
                        cb(null, syllabus, gradeIds);
                    }
                });
            },
            function (syllabus, gradeIds, cb) {
                GradeModel.find({'_id': {$in: gradeIds}}).exec(function (err, grades) {

                    if (err || !grades) {
                        retGrades = null;
                        if (callback)
                            callback();
                        return;
                    } else {
                        var len = grades.length;

//console.log(grades);
                        for (var i = 0; i < len; i++) {
                            var grade = grades[i];
                            tmp_grades[grade._id] = grade;
                        }
//console.log(grades);
                        cb(null, syllabus, gradeIds);
                    }
                });
            },
            function (syllabus, gradeIds, cb) {
                len = gradeIds.length;
                for (var i = 0; i < len; i++) {
                    var gradeId = gradeIds[i];
                    var grade = tmp_grades[gradeId];

                    retGrades.push({
                        'grade_id': gradeId,
                        'grade_title': grade.grade,
                        'grade_enabled': grade.enabled,
                        'syllabus_id': syllabus._id,
                        'syllabus_title': syllabus.title
                    });
                }
                retGrades.sort(function (a, b) {
                    return parseInt(a.grade_title) - parseInt(b.grade_title);
                });
                if (callback)
                    callback();
            }
        ]);
    },
    _getDiscussions = function (options, callback) {
        if (!options || !options.syllabus ||
            !options.grade || !options.school_name) {
            return callback(new Error('Some parameters are missing'));
        }
        var sort = { 'date': -1 }, chapter;
        // sort by
        if (options.sort === 'popular') {
            sort = { 'responsesCount': -1 };
        }

        var queryObject = {
            syllabus: options.syllabus,
            grade: options.grade,
            school_name: options.school_name
        };

        if (options.chapter === 'all' || !options.chapter) {
            chapter = 'all';
        } else {
            queryObject.chapter = options.chapter;
        }

        if (options.search) {
            queryObject['$text'] = {
                $search: options.search
            };
        }

        if (options.sortAnswers === 'unanswered') {
            queryObject.responsesCount = 0;
        }

        if (!options.limit) {
            options.limit = 10;
        }

        console.log(options.limit);

        //var d = [];

        async.waterfall([
            // get discussions
            function (cb) {
                DiscussionModel.find(queryObject).sort(sort).populate('user').limit(options.limit).lean().exec(function (err, discussions) {
                    if (err || discussions.length === 0) {
                        return cb(new Error('Not found'));
                    }
                    return cb(null, discussions);
                });
            },

            // get chapters
            function (d, cb) {
                async.each(d, function (discussion, next) {
                    getChapter(discussion.chapter, function (err, chapter) {
                        if (discussion.chapter === 'general') {

                            discussion.chapter = {
                                title: 'General Discussion'
                            };
                            return next();
                        }

                        if (err || !chapter) {
                            console.log('Chapter Not found');
                            return next(new Error('Chapter Not found'));
                        }

                        discussion.chapter = chapter;
                        console.log(chapter.toObject());
                        return next();
                    });
                }, function (err) {
                    if (err) {
                        return cb(new Error('Cannot get Chapter'));
                    }

                    cb(null, d);
                });
            }
        ], function (err, result) {
            if (err) {
                return callback(new Error('Internal error'));
            }

            return callback(null, result);
        });
    },
    getDiscussions = function (req, res) {
        _getDiscussions({
            syllabus: req.user.syllabus,
            grade: req.user.grade,
            school_name: req.user.school_name,
            sort: req.param('sort') || 'recent',
            chapter: req.param('chapter') || 'all',
            sortAnswers: req.param('sortAnswers') || 'all',
            limit: req.param('limit'),
            search: req.param('search')
        }, function (err, discussions) {
            if (err || discussions.length === 0) {
                return res.send({
                    'status_code': 404,
                    'message': 'Discussions not found'
                });
            }

            res.send({
                'status_code': 200,
                'discussions': discussions
            });
        });
    },
    createDiscussion = function (req, res) {
        if (!req.body.title) {
            console.log('Cannot create a new topic. Title is missing');
            return res.send({
                'status_code': 400,
                'message': 'Title is missing.'
            });
        }

        if (!req.body.text) {
            console.log('Cannot create a new topic. Text is missing');
            return res.send({
                'status_code': 400,
                'message': 'Text is missing.'
            });
        }
        console.log(req.body);
        if (!req.body.chapter) {
            console.log('Cannot create a new topic. chapter is missing');
            return res.send({
                'status_code': 400,
                'message': 'chapter is missing.'
            });
        }

        if (!req.user.id || !req.user.syllabus || !req.user.grade || !req.user.school_name) {
            return res.send({
                'status_code': 500,
                'message': 'Unable to create a new topic'
            });
        }

        var newDiscussion = new DiscussionModel();
        newDiscussion.title = req.body.title;
        newDiscussion.text = req.body.text;
        newDiscussion.user = req.user.id;


        newDiscussion.chapter = req.body.chapter;

        newDiscussion.syllabus = req.user.syllabus;
        newDiscussion.grade = req.user.grade;
        newDiscussion.school_name = req.user.school_name;

        newDiscussion.save(function (err) {
            if (err) {
                console.log(err);
                return res.send({
                    'status_code': 500,
                    'message': 'Unable to save.'
                });
            }

            return res.send({
                'status_code': 200,
                'message': 'Saved successfully.'
            });
        });
    },
    renderDiscussionPage = function (req, res) {
        async.waterfall([
            function(cb){
                DiscussionsController._getDiscussion(req.params.discussion, function (err, discussions) {
                    if(err){
                        return res.send({
                            'status_code': 400,
                            'message' : 'Error Discussion',
                        });
                    }
                    if(!discussions){
                        return res.send({
                            'status_code': 404,
                            'message': 'Discussion not found'
                        });
                    }
                    cb(null, discussions);
                });
            },
            function(disc, cb){
                return res.send({
                    'status_code': 200,
                    'discussion': disc,
                });
            }
        ]);
        
       
    },
    createDiscussionResponse = function (req, res) {
        if (!req.body.text) {
            console.log('Cannot create a new response. text is missing');
            return res.send({
                'status_code': 400,
                'message': 'text is missing.'
            });
        }

        if (req.body.text === '<div><br></div>') {
            console.log('Cannot create a new response. text is missing');
            return res.send({
                'status_code': 400,
                'message': 'text is missing.'
            });
        }

        if (!req.body.secondLvl) {
            console.log('Cannot create a new response. secondLvl is missing');
            return res.send({
                'status_code': 400,
                'message': 'secondLvl is missing.'
            });
        }

        if (!req.body.discussion) {
            console.log('Cannot create a new discussion. parent is missing');
            return res.send({
                'status_code': 400,
                'message': 'discussion is missing.'
            });
        }

        if (!req.user.id) {
            return res.send({
                'status_code': 401,
                'message': 'Unable to create a new response'
            });
        }

        if ((req.body.secondLvl === 'true') && !req.body.response) {
            console.log(req.body.secondLvl);
            console.log(req.body.response);
            return res.send({
                'status_code': 400,
                'message': 'response is missing.'
            });
        }

        var response = new DiscussionResponseModel();

        if (req.body.secondLvl === 'false') {
            DiscussionModel.findOne({_id: req.body.discussion}, function (err, discussion) {
                if (err) {
                    console.log(err);
                    return res.send({
                        'status_code': 500,
                        'message': 'Unable to find discusion object.'
                    });
                }

                response.user = req.user.id;
                response.text = req.body.text;
                response.secondLvl = req.body.secondLvl || response.secondLvl;
                response.discussion = discussion._id;
                discussion.responses.push(response._id);
                discussion.responsesCount += 1;

                response.save(function (err) {
                    if (err) {
                        console.log(err);
                        return res.send({
                            'status_code': 500,
                            'message': 'Unable to save changes in response object.'
                        });
                    }
                    console.log('Response saved');
                    discussion.save(function (err) {
                        if (err) {
                            console.log(err);
                            return res.send({
                                'status_code': 500,
                                'message': 'Unable to save changes in discussion object.'
                            });
                        }
                        console.log('discussion saved');
                        return res.send({
                            'status_code': 200,
                            'message': 'Saved successfully.',
                            'response': response.toObject()
                        });
                    });
                });

            });
        } else if (req.body.secondLvl === 'true') {
            DiscussionModel.findOne({_id: req.body.discussion}, function (err, discussion) {
                if (err) {
                    console.log(err);
                    return res.send({
                        'status_code': 500,
                        'message': 'Unable to find discusion object.'
                    });
                }

                DiscussionResponseModel.findById(req.body.response, function (err, resp) {
                    if (err) {
                        console.log(err);
                        return res.send({
                            'status_code': 500,
                            'message': err.message
                        });
                    }

                    response.user = req.user.id;
                    response.text = req.body.text;
                    response.secondLvl = req.body.secondLvl || response.secondLvl;
                    response.discussion = ObjectId(req.body.discussion);
                    resp.responses.push(response._id);
                    discussion.responsesCount += 1;

                    response.save(function (err) {
                        if (err) {
                            console.log(err);
                            return res.send({
                                'status_code': 500,
                                'message': err.message
                            });
                        }

                        resp.save(function (err) {
                            if (err) {
                                console.log(err);
                                return res.send({
                                    'status_code': 500,
                                    'message': err.message
                                });
                            }

                            discussion.save(function (err) {
                                if (err) {
                                    console.log(err);
                                    return res.send({
                                        'status_code': 500,
                                        'message': 'Unable to save changes in discussion object.'
                                    });
                                }

                                return res.send({
                                    'status_code': 200,
                                    'message': 'Saved successfully.',
                                    'response': response
                                });
                            });
                        });
                    });
                });

            });


        }
    }


    return {
        getBoard: getBoard,
        getConcepts: getConcepts,
        getConcept: getConcept,
        getLinks: getLinks,
        getGrades: getGrades,
        getSyllabuses: getSyllabuses,
        getChapers: getChapers,
        getDiscussions: getDiscussions,
        createDiscussion: createDiscussion,
        renderDiscussionPage: renderDiscussionPage,
        createDiscussionResponse: createDiscussionResponse,
    };
}();

module.exports = indexApi;
