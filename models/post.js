// Mongoose db Connection
var mongoose = require('mongoose');

var postSchema = mongoose.Schema({
    content: String,
    youtube_url: String,
    image: String,
    user:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    like:[{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Like"
    }],
    comment:[{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Comment"
    }],
    create_date: String,
    update_date: String        
},
{ 
    timestamps: true
});
var Post = mongoose.model('Post', postSchema);
module.exports = Post;