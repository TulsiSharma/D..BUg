var mongoose = require("mongoose");

var commentschema = mongoose.Schema({
		id: String,
		username:String,
		title: String

});
module.exports= mongoose.model("Comment",commentschema);