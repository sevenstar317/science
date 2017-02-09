/**
 * Discussion Model
 */

var Discussions = function() {
    var mongoose = require('mongoose'),
        Schema = mongoose.Schema,
        discussionSchema = new Schema({
            user: {
                type: Schema.ObjectId,
                ref: 'User',
                required: true
            },
            chapter: {
                type: String,
                default: 'general'
            },


            syllabus: {
                type: Schema.ObjectId,
                ref: 'Syllabus',
                required: true
            },
            grade: {
                type: Schema.ObjectId,
                ref: 'Grade',
                required: true
            },
            school_name: {
                type: String,
                required: true
            },



            title: {
                type: String,
                required: true
            },
            text: {
                type: String,
                required: true
            },
            date: {
                type: Date,
                default: Date.now
            },
            responses: [{
                    type: Schema.ObjectId,
                    ref: 'DiscussionResponse',
                    default: []
            }],
            /*responses: {
                type: [Schema.ObjectId],
                default: []
            },*/
            votes: {
                type: [Schema.ObjectId],
                default: []
            },
            responsesCount: {
                type: Number,
                default: 0
            }
        });

    discussionSchema.index({title: 'text', text: 'text'});

    return mongoose.model('Discussion', discussionSchema);
}();

module.exports = Discussions;

