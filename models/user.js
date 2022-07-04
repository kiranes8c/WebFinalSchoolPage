// Mongoose db Connection
var mongoose = require('mongoose');
var userSchema = mongoose.Schema({
    username: { type: String, lowercase: true },
    name: String,
    email: String,
    password: String,
    role: Number,
    id_gg: String,
    post:[{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Post"
    }],
    like:[{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Like"
    }],
    notification:[{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Notification"
    }],
    class: String,
    image_url: String,
    department: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Department"
    }]
});
var User = mongoose.model('User', userSchema);
module.exports = User;