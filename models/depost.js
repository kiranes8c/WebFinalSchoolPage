// Mongoose db Connection
var mongoose = require("mongoose");

var depostSchema = mongoose.Schema(
  {
    content: String,
    image: String,
    create_date: String,
    update_date: String,
  },
  {
    timestamps: true,
  }
);
var Depost = mongoose.model("Depost", depostSchema);
module.exports = Depost;
