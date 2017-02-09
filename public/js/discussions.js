var rich, editor;

function viewUserById(userId) {

    var userInfo;
    var photo;
    $.ajax({
        type: 'GET',
        url: '/get/user/'+userId,
        success: function(res) {
            //console.log(res);
            /*if (!userInfo || !userInfo.id || userInfo.id == '')
                return;*/
            userInfo = res.user;
            
            showReportOption(false);

            $('#user-modal .name').text(userInfo.name);
            $('#user-modal .name').attr('classmate_id', userInfo._id);
            $('#user-modal .school-name').text(userInfo.school_name);
            $('#user-modal .location').text(userInfo.school_addr);
            $('#user-modal .grade-section').text(userInfo.grade + 'th Grade, Section ' + userInfo.section);
            $('#user-modal .email').text(userInfo.email);
            if (userInfo.photo == '')
                photo = '/images/guest.png';
            else
                photo = userInfo.photo;

            $('#user-modal .user-photo').attr('src', photo);

            if (userInfo.receive_update == 'true') {
                $('.on-off-btnset .btn-success').show();
                $('.on-off-btnset .btn-default').hide();
            } else {
                $('.on-off-btnset .btn-success').hide();
                $('.on-off-btnset .btn-default').show();
            }

            $('#user-modal').modal('toggle');
        }
    });
}

var fromNow = function(d) {
    var elapsed = Date.now() - new Date(d);

    var temp = {
        milliseconds: elapsed,
        seconds: Math.floor(elapsed / 1000),
        minutes: Math.floor(elapsed / (1000 * 60)),
        hours: Math.floor(elapsed / (1000 * 60 * 60)),
        days: Math.floor(elapsed / (1000 * 60 * 60 * 24))
    };

    if (temp.days >= 1) {
        if (temp.days == 1) {
            return temp.days + ' day ago';
        }
        return temp.days + ' days ago';
    }

    if (temp.hours >= 1) {
        if (temp.hours == 1) {
            return temp.hours + ' hour ago';
        }
        return temp.hours + ' hours ago';
    }

    if (temp.minutes >= 1) {
        if (temp.minutes == 1) {
            return temp.minutes + ' min ago';
        }
        return temp.minutes + ' mins ago';
    }

    return 'Just now';
};

function makeEditor () {
    editor = null;
    editor = new Quill('#full-editor', {
        modules: {
            'toolbar': { container: '#toolbar' }
        },
        theme: 'snow'
    });
}

$(document).ready(function(){
//$('#user-modal').modal('toggle');
    rich = '<div id="rich-editor" class="hidden rich-editor">';
    rich += $('#rich-editor').html();
    rich += '</div>';
    $('#rich-editor').remove();

    var discussionSearch = $('#discussion-search'),
        discussionChapter = $('#discussion-chapter'),
        discussionSortBy = $('#discussion-sort-by'),
        discussionModal = $('#discussion-modal'),
        discussionChapterModal = discussionModal.find('.discussion-chapter'),
        discussionCreate = $('#discussion-create'),
        responseCreateBtn = $('#response-save'),
        discussionsBlock = $('#discussions-block');

    var searchText = null;

    $('#discussion-search-text').keydown(function () {
        if (event.keyCode == 13) {
            searchText = $('#discussion-search-text').val();
            getDiscussions(function (discussions) {
                viewDiscussions(discussions);
            });
        }
    });

    discussionSearch.on('click', function () {
        searchText = $('#discussion-search-text').val();
        getDiscussions(function (discussions) {
            viewDiscussions(discussions);
        });
    });

    $('.discussion-options a.reply').on('click', function (e) {
        e.preventDefault();

        $('.reply.response').addClass('hidden');
        $('#rich-editor').remove();

        $('#send-response').removeClass('hidden');
        $('#send-response').find('.editor-box').empty().append($(rich));
        $('#rich-editor').removeClass('hidden');
        makeEditor();
        //editor.setText('');
    });

    $('.response-options a.reply').on('click', function (e) {
        e.preventDefault();
        
        $('#send-response').addClass('hidden');
        $('.reply.response').addClass('hidden');
        $('#rich-editor').remove();

        var response = $(this).parent().parent().parent();
        response.find('.reply.response').removeClass('hidden');

        response.find('.reply.response').find('.editor-box').append($(rich));
        $('#rich-editor').removeClass('hidden');
        makeEditor();
        //editor.setText('');
    });

    discussionCreate.on('click', function (e) {
        e.preventDefault();
        $('#discussion-modal').modal('toggle');
    });

    responseCreateBtn.on('click', function (e) {
        e.preventDefault();
        var sendResponse = $('#send-response');

        if (editor.getText() == false) {
            var alertElem = '<div class="alert alert-danger alert-dismissable">';

            alertElem += '<p>text is misdfssing</p></div>';
            $('#alert-modal').empty();
            $('#alert-modal').append(alertElem);
            $('#alert-modal').removeClass('hidden');

            setTimeout(
                function(){
                    $('#alert-modal').addClass('hidden');
                },
                1500
            );
        } else {
            createResponse({
                text: editor.getHTML(),
                secondLvl: sendResponse.data('secondlvl') || false,
                discussion: sendResponse.data('discussion')
            });
        }
        
    });

    $('a.reply-save').on('click', function (e) {
        e.preventDefault();
        var parent = $(this).parent().parent().parent();
        if (editor.getText() == false) {
            var alertElem = '<div class="alert alert-danger alert-dismissable">';

            alertElem += '<p>text is misdfssing</p></div>';
            $('#alert-modal').empty();
            $('#alert-modal').append(alertElem);
            $('#alert-modal').removeClass('hidden');

            setTimeout(
                function(){
                    $('#alert-modal').addClass('hidden');
                },
                1500
            );
        } else {
            console.log(editor.getHTML());
            createResponse({
                text: editor.getHTML(),
                secondLvl: parent.data('secondlvl') || false,
                discussion: parent.data('discussion'),
                response: parent.data('response')
            });
        }
    });

    discussionChapter.on('change', function (e) {
        if ($(this).val() === 'all') {
            discussionChapterModal.val('general');
        } else {
            discussionChapterModal.val($(this).val());
        }
        getDiscussions(function (discussions) {
            viewDiscussions(discussions);
        });
    });//

    discussionSortBy.on('change', function (e) {
        getDiscussions(function (discussions) {
            viewDiscussions(discussions);
        });
    });

    $('#discussion-sort-answers').on('change', function (e) {
        getDiscussions(function (discussions) {
            viewDiscussions(discussions);
        });
    });

    var loadMore = function (e) {
        e.preventDefault();
        console.log('ok');
        $('#discussion-limit').val(parseInt($('#discussion-limit').val()) + 10);
        getDiscussions(function (discussions) {
            viewDiscussions(discussions);
        });
    };

    $('.loadmore').on('click', loadMore);

    var getDiscussions = function (cb) {
        $.ajax({
            type: 'GET',
            url: '/get/discussions',
            data: {
                sort: $('#discussion-sort-by').val(),
                sortAnswers: $('#discussion-sort-answers').val(),
                chapter: discussionChapter.val(),
                limit: $('#discussion-limit').val(),
                search: searchText
            },
            success: function(res) {
                if (res.status_code === 200) {
                    cb(res.discussions);
                } else {
                    discussionsBlock.empty();
                    discussionsBlock.append($('<p>Discussions not found</p>'));
                }
                //searchText = null;
                //$('#discussion-search-text').val('');
            }
        });
    };

    var createDiscussion = function () {

        $.ajax({
            type: 'POST',
            url: '/create/discussion',
            data: {
                title: $('.discussion-title').val(),
                text: $('.discussion-text').val(),
                chapter: discussionChapterModal.val()
            },
            success: function(res) {
                $('#wait').addClass('hidden');
                var alertElem;

                if (res.status_code == 200) {
                    alertElem = '<div class="alert alert-success alert-dismissable">';
                }
                else
                    alertElem = '<div class="alert alert-danger alert-dismissable">';

                alertElem += '<p>' + res.message + '</p></div>';
                $('#alert-modal').empty();
                $('#alert-modal').append(alertElem);
                $('#alert-modal').removeClass('hidden');

                setTimeout(
                    function(){
                        $('#alert-modal').addClass('hidden');
                        if (res.status_code == 200)
                            location.reload();
                    },
                    1500
                );
            }
        });
    };

    var createResponse = function (options) {

        $.ajax({
            type: 'POST',
            url: '/create/response',
            data: {
                text: options.text,
                secondLvl: options.secondLvl || false,
                discussion: options.discussion,
                response: options.response
            },
            error: function () {
                $('#wait').addClass('hidden');
                var alertElem = '<div class="alert alert-danger alert-dismissable">';

                alertElem += '<p>' + 'Error!!!' + '</p></div>';
                $('#alert-modal').empty();
                $('#alert-modal').append(alertElem);
                $('#alert-modal').removeClass('hidden');

                setTimeout(
                    function(){
                        $('#alert-modal').addClass('hidden');
                        //if (res.status_code == 200)
                            //location.reload();
                    },
                    1500
                );
            },
            success: function(res) {
                $('#wait').addClass('hidden');
                var alertElem;

                if (res.status_code == 200) {
                    alertElem = '<div class="alert alert-success alert-dismissable">';
                }
                else
                    alertElem = '<div class="alert alert-danger alert-dismissable">';

                alertElem += '<p>' + res.message + '</p></div>';
                $('#alert-modal').empty();
                $('#alert-modal').append(alertElem);
                $('#alert-modal').removeClass('hidden');

                setTimeout(
                    function(){
                        $('#alert-modal').addClass('hidden');
                        if (res.status_code == 200)
                            location.reload();
                    },
                    1500
                );
            }
        });
    };

    $('a.vote').on('click', function (e) {
        e.preventDefault();
        var response = $(this).parent().parent().parent();
        var id = response.data('response-id');

        if (id) {
            var p = $('.response[data-response-id="' + id + '"] > div > .response-options p.votes-count').removeClass('hidden');
            voteForResponse(id, function (err, votes) {
                if (err) {
                    console.log(err);
                    return;
                }
                p.text('+' + votes);
            });
        } else {
            id = $(this).parent().parent().data('discussion-id');
            var p = $('.discussion[data-discussion-id="' + id + '"] > .discussion-options > p.votes-count').removeClass('hidden');
            voteForDiscussion(id, function (err, votes) {
                if (err) {
                    console.log(err);
                    return;
                }
                p.text('+' + votes);
            });
        }

    });
    var voteForResponse = function (id, cb) {
        var alertElem = '';
        var modal = $('#alert-modal');
        $.ajax({
            type: 'POST',
            url: '/vote/response',
            data: {
                responseId: id
            },
            success: function(res) {
                //console.log(res);
                if (res.status_code == 200) {
                    alertElem = '<div class="alert alert-success alert-dismissable">';
                    cb(null, res.votes);
                } else {
                    alertElem = '<div class="alert alert-danger alert-dismissable">';
                    alertElem += '<p>' + res.message + '</p></div>';
                    modal.empty();
                    modal.append(alertElem);
                    modal.removeClass('hidden');

                    setTimeout(
                        function(){
                            $('#alert-modal').addClass('hidden');
                        },
                        3000
                    );
                }
            }
        });
    };

    // $('div.discussion .buttons a.vote').on('click', function (e) {
    //     e.preventDefault();
    //     var discussion = $(this).parent().parent();
    //     var id = discussion.data('discussion-id');
    //     console.log(id);
    //     $('#vote-modal').find('.vote-yes.btn').data('discussion-id', id);
    //     $('#vote-modal').modal('toggle');
    // });
    var voteForDiscussion = function (id, cb) {
        var alertElem = '';
        var modal = $('#alert-modal');
        $.ajax({
            type: 'POST',
            url: '/vote/discussion',
            data: {
                discussionId: id
            },
            success: function(res) {
                console.log(res);
                if (res.status_code === 200) {
                    cb(null, res.votes);
                } else {
                    alertElem = '<div class="alert alert-danger alert-dismissable">';
                    alertElem += '<p>' + res.message + '</p></div>';
                    modal.empty();
                    modal.append(alertElem);
                    modal.removeClass('hidden');

                    setTimeout(
                        function(){
                            $('#alert-modal').addClass('hidden');
                        },
                        3000
                    );
                }
            }
        });
    };

    

    var viewDiscussions = function (discussions) {
        var template = '';
        var length = discussions.length;
        for(var i = 0; i < length; i++) {
            var d = discussions[i];

            template += '<div data-discussion-id="'+ d._id + '" class="discussion-item">'+
                        '<a href="/discussion/' + d._id + '" class="title">' + d.title + '</a>' +
                        '<div class="info">'+
                            '<a href="#" onclick="viewUserById(\'' + d.user._id + '\')" class="owner">'+ d.user.name + '</a>'+
                            '<p class="date">' + fromNow(d.date) + '</p>'+
                            '<p class="chapter">' + d.chapter.title + '</p>'+
                            '<a href="/discussion/'+ d._id + '/#responses" class="replies">'+ d.responsesCount + ' replies</a></div></div>';
        }

        template += '<a href="#" class="btn btn-default loadmore">Load More Posts</a>';
        discussionsBlock.empty();
        discussionsBlock.append($(template));
        $('.loadmore').on('click', loadMore);
    };

    discussionModal.find('.discussion-create').on('click', function (e) {
        e.preventDefault();
        createDiscussion();
    });
    $('.user-school').text(user.school_name + ', ' +  user.grade_name + 'th Grade, ' + user.section_name);
    /*getDiscussions(function (discussions) {
        viewDiscussions(discussions);
    });*/
    $('.content-wrapper').height($(document).height() - $('.header.navbar').outerHeight() - $('.top-nav').outerHeight() - $('.footer').outerHeight() - 5);
});