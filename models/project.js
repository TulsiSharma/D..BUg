var mongoose = require("mongoose");

var projectschema = mongoose.Schema({
	Projectname: String,
	description: String,
	projectfile: String,
	projecttype: String,
	projecttech: String
});

module.exports = mongoose.model("project",projectschema);