/**
 * discussions Controller
 */

var discussion = function () {
    var DiscussionModel = require('../models/discussion');
    var UserModel = require('../models/users');
    var mongoose = require('mongoose');
    var ChapterModel = require('../models/chapters');
    var GradeModel = require('../models/grades');
    var DiscussionResponseModel = require('../models/discussionResponse');
    var async = require('async');
    var extend = require('util')._extend;
    var dateFormat = require('dateformat');
    var ObjectId = require('mongodb').ObjectID;

    var _getDiscussions = function (options, callback) {
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
    };

    var _getDiscussion = function (id, callback) {
        if (!id) {
            return callback(new Error('Some parameters are missing'));
        }
        var discus = null;
        async.waterfall([
            // get discussion
            function (cb) {
                DiscussionModel.findOne({'_id': id})
                    .populate('user')
                    .populate({path: 'responses', options: { sort: { 'date': -1 } } }).lean().exec(function (err, discussion) {

                    if (err || !discussion) {
                        return cb(new Error('Discussion Not found'));
                    }

                    DiscussionModel.populate(discussion,{
                        path: 'responses.user',
                        model: 'User'
                    }, function (err, discussion) {
                        if (err || !discussion) {
                            return cb(new Error('Discussion Not found'));
                        }

                        discus = extend({},discussion);
                        //console.log(discus.responses[0].responses);
                        cb(null, discus);
                    });
                });
            },

            // get responses
            function (discus, cb) {
                async.each(discus.responses, function (response, next1) {
                    if (response.responses.length > 0) {
                        var temp = [];

                        async.each(response.responses, function (response, next2) {
                            //console.log(response);
                            DiscussionResponseModel.findOne({'_id': response}).sort({ 'date': -1 }).populate('user').exec(function (err, resp) {
                                if (err) {
                                    return next2(new Error('Response Not found'));
                                }
                                //console.log(resp);
                                temp.unshift(resp);
                                next2();
                            });
                        }, function (err) {
                            if (err) {
                                return cb(err);
                            }
                            response.responses = temp;
                            next1(null);
                        });

                    } else {
                        next1(null);
                    }
                }, function (err) {
                    if (err) {
                        return cb(new Error('Discussion Not found'));
                    }

                    cb(null, discus);
                });
            },

            // get chapter
            function (discus, cb) {
                if (discus.chapter !== 'general') {
                    getChapter(discus.chapter, function (err, chapter) {
                        if (err || !chapter) {
                            return cb(new Error('Chapter Not found'));
                        }
                        discus.chapter = chapter.toObject();
                        console.log(discus.chapter.title);
                        return cb(null, discus);
                    });
                } else {
                    discus.chapter = {
                        title: 'General Discussion'
                    };
                    return cb(null, discus);
                }
            },

            function (discus, cb) {
                cb(null, discus);
            }
        ], function (err, discus) {
            if (err) {
                return callback(err);
            }

            return callback(null, discus);
        });
    };

    var _getUser = function (id, cb) {
        UserModel.findOne({
            _id: id
        }, function (err, user) {
            if (err) {
                return cb(err);
            }

            cb(null, user);
        });
    };

    var getUser = function (req, res) {
        if (!req.params.userid) {
            return res.send({
                'status_code': 400,
                'message': 'User id is missing'
            });
        }

        if (!req.session.user.id) {
            return res.send({
                'status_code': 401,
                'message': 'Need to be authorized'
            });
        }

        async.waterfall([
            function (next) {
                _getUser(req.params.userid, function (err, user) {
                    if (err) {
                        return next(err);
                    }

                    if (!user) {
                        return next(new Error('User not wound'));
                    }

                    next(err, user.toObject());
                });
            },

            function (user, next) {
                GradeModel.findOne({_id: user.grade}, function (err, grade) {
                    if (err) {
                        return next(err);
                    }

                    if (!grade) {
                        return next(new Error('Grade not wound'));
                    }

                    user.grade = grade.grade;

                    next(err, user);
                });
            }
        ], function (err, user) {
            if (err) {
                return res.send({
                    'status_code': 404,
                    'message': err.message
                });
            }

            return res.send({
                'status_code': 200,
                'message': 'Ok',
                'user': user
            });
        });
    };

    var getChapter = function (id, cb) {
        ChapterModel.findOne({
            _id: id
        }, function (err, chapter) {
            if (err) {
                return cb(err);
            }

            cb(null, chapter);
        });
    };

    var getDiscussions = function (req, res) {
        _getDiscussions({
            syllabus: req.session.user.syllabus,
            grade: req.session.user.grade,
            school_name: req.session.user.school_name,
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
    };

    var createDiscussionResponse = function (req, res) {
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

        if (!req.session.user.id) {
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

                response.user = req.session.user.id;
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

                    response.user = req.session.user.id;
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
    };

    var createDiscussion = function (req, res) {
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

        if (!req.body.chapter) {
            console.log('Cannot create a new topic. chapter is missing');
            return res.send({
                'status_code': 400,
                'message': 'chapter is missing.'
            });
        }

        if (!req.session.user.id || !req.session.user.syllabus || !req.session.user.grade || !req.session.user.school_name) {
            return res.send({
                'status_code': 500,
                'message': 'Unable to create a new topic'
            });
        }

        var newDiscussion = new DiscussionModel();
        newDiscussion.title = req.body.title;
        newDiscussion.text = req.body.text;
        newDiscussion.user = req.session.user.id;


        newDiscussion.chapter = req.body.chapter;

        newDiscussion.syllabus = req.session.user.syllabus;
        newDiscussion.grade = req.session.user.grade;
        newDiscussion.school_name = req.session.user.school_name;

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
    };

    var respondToResponse = function (req, res) {
        if (!req.body.responseId) {
            return res.send({
                'status_code': 400,
                'message': 'Response id is missing'
            });
        }

        if (!req.session.user.id) {
            return res.send({
                'status_code': 401,
                'message': 'Unable to save.'
            });
        }

        res.send({
            'status_code': 200,
            'message': 'OK'
        });
    };

    var voteResponse = function (req, res) {
        if (!req.body.responseId) {
            return res.send({
                'status_code': 400,
                'message': 'Response id is missing'
            });
        }

        if (!req.session.user.id) {
            return res.send({
                'status_code': 401,
                'message': 'Unable to save.'
            });
        }

        DiscussionResponseModel.findById(req.body.responseId, function (err, response) {
            if (err) {
                return res.send({
                    'status_code': 500,
                    'message': err.message
                });
            }

            if (response.votes.indexOf(req.session.user.id) === -1) {
                response.votes.push(req.session.user.id);
                response.save(function (err) {
                    if (err) {
                        return res.send({
                            'status_code': 500,
                            'message': err.message
                        });
                    }

                    return res.send({
                        'status_code': 200,
                        'message': 'Saved successfully.',
                        'votes': response.votes.length
                    });
                });
            } else {
                return res.send({
                    'status_code': 400,
                    'message': 'Already voted.',
                    'votes': response.votes.length
                });
            }
        });
    };

    var voteDiscussion = function (req, res) {
        if (!req.body.discussionId) {
            return res.send({
                'status_code': 400,
                'message': 'Response id is missing'
            });
        }

        if (!req.session.user.id) {
            return res.send({
                'status_code': 401,
                'message': 'Unable to save.'
            });
        }

        DiscussionModel.findById(req.body.discussionId, function (err, discussion) {
            if (err) {
                return res.send({
                    'status_code': 500,
                    'message': err.message
                });
            }

            if (discussion.votes.indexOf(req.session.user.id) === -1) {
                discussion.votes.push(req.session.user.id);
                discussion.save(function (err) {
                    if (err) {
                        return res.send({
                            'status_code': 500,
                            'message': err.message
                        });
                    }

                    return res.send({
                        'status_code': 200,
                        'message': 'Saved successfully.',
                        'votes': discussion.votes.length
                    });
                });
            } else {
                return res.send({
                    'status_code': 400,
                    'message': 'Already voted.',
                    'votes': discussion.votes.length
                });
            }
        });
    };

    return {
        getDiscussions: getDiscussions,
        _getDiscussions: _getDiscussions,
        _getDiscussion: _getDiscussion,
        createDiscussion: createDiscussion,
        voteResponse: voteResponse,
        voteDiscussion: voteDiscussion,
        respondToResponse: respondToResponse,
        getUser: getUser,
        createDiscussionResponse: createDiscussionResponse
    };
}();

module.exports = discussion;