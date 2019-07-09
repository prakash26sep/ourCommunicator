var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var postsBySchema = new Schema({
    name     : String,
    postText : String,
    email    : String,
    wows: Number
});

//mongoose.model("Comments", Comments);

module.exports= mongoose.model("posts", postsBySchema);