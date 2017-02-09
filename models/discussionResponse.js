/**
 * DiscussionResponse Model
 */

var DiscussionResponses = function() {
    var mongoose = require('mongoose'),
        Schema = mongoose.Schema,
        discussionResponseSchema = new Schema({
            user: {
                type: Schema.Types.ObjectId,
                ref: 'User',
                required: true
            },
            discussion: {
                type: Schema.ObjectId,
                required: true
            },
            date: {
                type: Date,
                default: Date.now
            },
            text: {
                type: String,
                required: true
            },
            votes: {
                type: [Schema.ObjectId],
                default: []
            },
            responses: [{
                type: Schema.ObjectId,
                ref: 'DiscussionResponse',
                default: []
            }],
            secondLvl: {
                type: Boolean,
                default: false
            },
            parent: {
                type: Schema.ObjectId,
                default: null
            }
        });

    return mongoose.model('DiscussionResponse', discussionResponseSchema);
}();

module.exports = DiscussionResponses;
