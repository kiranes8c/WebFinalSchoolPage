// Mongoose db Connection
var mongoose = require('mongoose');

var departmentSchema = mongoose.Schema({
    departmentName: String,
    role: Number,
    notification: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Notification"
    }]
});
var Department = mongoose.model('Department', departmentSchema);
module.exports = Department;