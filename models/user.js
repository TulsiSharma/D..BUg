var mongoose = require("mongoose");
var passwordlocalmongoose = require("passport-local-mongoose");

var newuser= mongoose.Schema({
	Username: String,
	email: String,
	password: String,
	Imageurl: String,
	projects: [
		{
			type : mongoose.Schema.Types.ObjectId,
			ref : "project"
		}
	]
});

newuser.plugin(passwordlocalmongoose);
module.exports=mongoose.model("User",newuser);