// Mongoose db Connection
var mongoose = require('mongoose');

var commentSchema = mongoose.Schema({
    content: String,
    user:{
          type: mongoose.Schema.Types.ObjectId,
          ref: "User"
    },
    post:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Post"
    },
    create_date: String,
    update_date: String     
},
{ 
    timestamps: true
});
var Comment = mongoose.model('Comment', commentSchema);
module.exports = Comment;