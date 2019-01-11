var express = require("express");
var methodoverride = require("method-override");
var Multer  =   require('multer');
var app		= express();
var mongoose = require("mongoose");
var cookieparser= require("cookie-parser");
var project = require("./models/project.js");
var passport = require("passport");
var passport1=require("./models/passport.js")(passport);
var localstrategy= require("passport-local");
var bodyparser= require("body-parser");
var flash    =  require("connect-flash");
var Comment = require("./models/comment.js");
var firebase = require("firebase");
var fs = require("fs");
var path = require("path");
var promise = require('promise');
var config  = require('./config/fb.js');
var FacebookStrategy  = require('passport-facebook').Strategy;
var AdmZip = require('adm-zip');
//app.use(passport1());
var User = require("./models/user.js");
var https = require("https");
var url = require("url");
var JSZip = require("jszip");

//================method-override=========================
app.use(methodoverride("_method"));


//========================APIS===============================
	
app.get('/auth/google', passport.authenticate('google', { scope : ['profile', 'email'] }));
app.get('/auth/google/callback',
        passport.authenticate('google', {
            successRedirect : '/',
            failureRedirect : '/register'
    }));



//========================facebook api==========================
passport.use(new FacebookStrategy({
    clientID: config.facebook_api_key,
    clientSecret:config.facebook_api_secret ,
    callbackURL: config.callback_url
  },
 	async function(accessToken, refreshToken, profile, done) {
      //Check whether the User exists or not using profile.id
      //Further DB code.
      	console.log(profile);
    	// await User.findOne({facebookID: profile.id}).then(user => {
     //              if(user){
     //                  // Return user
     //                  done(null, user);
     //              } 
     //             else {
     //              console.log("not found!!!!");
     //                // if the user isnt in our database, create a new user
     //               //const image = profile.photos[0].value.substring(0, profile.photos[0].value.indexOf('?'));
     //                var first=profile.name.givenName;
     //                var second= profile.name.familyName;
     //                const newUser = {
     //                    id: profile.id,
     //                    username: first+" "+second,
     //                    email: profile.email,
     //                    Imageurl: profile.picture.url
     //                  }
     //                  console.log(newUser);
     //                // save the user
     //                   new User(newUser).save().then(user => done(null, user));
     //             }
           // });
    }
));

app.get('/auth/facebook', passport.authenticate('facebook'));
app.get('http://localhost:3000/auth/facebook/callback',
  passport.authenticate('facebook', { 
       successRedirect : '/', 
       failureRedirect: '/register' 
  }),
  function(req, res) {
    res.redirect('/');
  });


//======================body-parser=================================
var bodyparser= require("body-parser");

app.use(bodyparser.urlencoded({extended: true}));
app.use(bodyparser.json());
app.use(flash());

 //=====================passport configuration===============
	app.use(require("express-session")({
		secret:"once again user signin",
		resave: false,
		saveUninitialized: false
	}));
	app.use(passport.initialize());
	app.use(passport.session());
	passport.use(new localstrategy(User.authenticate()));
	passport.serializeUser(User.serializeUser());
	passport.deserializeUser(User.deserializeUser());


//=======================connect-flash==============================



//===========================firebase storage===========================
	

//==================varibale passing to templates======================
	
	app.use(function(req,res,next){
		res.locals.currentuser = req.user;
		res.locals.error= req.flash("error");
		res.locals.success = req.flash("success");
		res.locals.signup = req.flash("signup");
		res.locals.login = req.flash("login");
		res.locals.notsignin = req.flash("notsignin");
		res.locals.Error = req.flash("Error");
		res.locals.accountupdate = req.flash("accountupdate");
		res.locals.nocomment = req.flash("no-comment");
		next();
	});

app.use(express.static("public"));
app.use(express.static("uploads"));
app.set("view engine","ejs");

app.get("/",function(req,res){
	res.render("home",{currentuser:req.user});
});

app.get("/dbug/about",function(req,res){
	res.render("about");
});
app.get("/register",function(req,res){
	res.render("signup");
});
app.get("/login",function(req,res){
	res.render("login",{middle:req.flash("error")});

});

app.get("/:id/reset",function(req,res){
	res.render("reset");
});
app.get("/projects",isloggedin,function(req,res){
	 Comment.find({},function(err,comment){
	 	if(err){
	 		console.log(err);
	 	} else{
	 		console.log(comment);
	 		res.render("project",{comment:comment,currentuser:req.user});
	 	}

	 });
	
});
app.get("/account",function(req,res){
	User.findById(req.user._id).populate("projects").exec(function(err,projects){
		if(err){
			console.log(err);
		}
		res.render("Account",{currentuser:projects});
		
	});
});
app.post("/account",function(req,res){
	
	User.findById(req.user.id, function (err, user) {

        // todo: don't forget to handle err

        if (!user) {
            req.flash('error', 'No account found');
            return res.redirect('/account');
        }

        // good idea to trim 
        var email = req.body.email.trim();
        var username = req.body.username.trim();
        var image=req.body.url;
        user.email = email;
        user.username = username;
        user.Imageurl=image;
          user.save(function (err) {

            // todo: don't forget to handle err
            if(err)
            	console.log(err);
            res.redirect('/');
        });
    });

});
	

	
		
app.get("/dbug/new",isloggedin,function(req,res){
	res.render("New",{name : req.user});
});

app.post("/dbug/:id/new/",function(req,res){
	var data={Projectname:req.body.Name,description:req.body.description,projectfile:req.body.url,
	projecttype:req.body.Type,projecttech: req.body.projecttech};
	project.create(data,function(err,data){
		if(err)
			console.log(err);
		data.save(function(err,saved){
			if(err)
				console.log(err);
			User.findById(req.params.id,function(err,user){
				if(err)
					console.log(err);
				user.projects.push(saved);
				user.save();
				res.redirect("/dbug/new");
			});	
			
		});
	});
});

//======================search routes====================

app.get("/projects/html/css",function(req,res){
	project.find({"projecttech":"htmlcss"},function(err, result) {
    if (err) throw err;
    res.render("list",{result:result,proname:"HTML/CSS",protype:"All"});
    
  });
});
app.get("/projects/html/css/major",function(req,res){
	project.find({"projecttype":"major","projecttech":"htmlcss"},function(err, result) {
    if (err) throw err;
     res.render("list",{result:result,proname:"HTML/CSS",protype:"Major"});
    
  });
});

app.get("/projects/html/css/minor",function(req,res){
	project.find({"projecttype":"minor","projecttech":"htmlcss"},function(err, result) {
    if (err) throw err;
     res.render("list",{result:result,proname:"HTML/CSS",protype:"Minor"});
    
  });
});

app.get("/projects/javascript",function(req,res){
	project.find({"projecttech":"javascript"},function(err, result) {
    if (err) throw err;
     res.render("list",{result:result,proname:"Javascript",protype:"All"});
    
  });
});

app.get("/projects/javascript/major",function(req,res){
	project.find({"projecttype":"major","projecttech":"javascript"},function(err, result) {
    if (err) throw err;
    res.render("list",{result:result,proname:"Javascript",protype:"Major"});
    
  });
});

app.get("/projects/javascript/minor",function(req,res){
	project.find({"projecttype":"minor","projecttech":"javascript"},function(err, result) {
    if (err) throw err;
    res.render("list",{result:result,proname:"Javascript",protype:"Minor"});
    
  });
});

app.get("/projects/python",function(req,res){
	project.find({"projecttech":"python"},function(err, result) {
    if (err) throw err;
    res.render("list",{result:result,proname:"Python",protype:"All"});
    
  });
});

app.get("/projects/python/major",function(req,res){
	project.find({"projecttype":"major","projecttech":"python"},function(err, result) {
    if (err) throw err;
    res.render("list",{result:result,proname:"Python",protype:"Major"});
    
  });
});

app.get("/projects/python/minor",function(req,res){
	project.find({"projecttype":"minor","projecttech":"python"},function(err, result) {
    if (err) throw err;
   	res.render("list",{result:result,proname:"Python",protype:"Minor"});
    
  });
});




app.get("/projects/c/cpp",function(req,res){
	project.find({"projecttech":"ccpp"},function(err, result) {
    if (err) throw err;
    res.render("list",{result:result,proname:"C/CPP",protype:"All"});
    
  });
});

app.get("/projects/c/cpp/major",function(req,res){
	project.find({"projecttype":"major","projecttech":"ccpp"},function(err, result) {
    if (err) throw err;
    res.render("list",{result:result,proname:"C/CPP",protype:"Major"});
    
  });
});

app.get("/projects/c/cpp/minor",function(req,res){
	project.find({"projecttype":"minor","projecttech":"ccpp"},function(err, result) {
    if (err) throw err;
    res.render("list",{result:result,proname:"C/CPP",protype:"Minor"});
    
  });
});

app.get("/projects/Java",function(req,res){
	project.find({"projecttech":"java"},function(err, result) {
    if (err) throw err;
   	res.render("list",{result:result,proname:"Java",protype:"All"});
    
  });
});

app.get("/projects/java/major",function(req,res){
	project.find({"projecttype":"major","projecttech":"java"},function(err, result) {
    if (err) throw err;
    res.render("list",{result:result,proname:"Java",protype:"Major"});
    
  });
});

app.get("/projects/java/minor",function(req,res){
	project.find({"projecttype":"minor","projecttech":"java"},function(err, result) {
    if (err) throw err;
    res.render("list",{result:result,proname:"Java",protype:"Minor"});
    
  });
});


app.get("/projects/android",function(req,res){
	project.find({"projecttech":"android"},function(err, result) {
    if (err) throw err;
    res.render("list",{result:result,proname:"Android",protype:"All"});
  });
});

app.get("/projects/android/major",function(req,res){
	project.find({"projecttype":"major","projecttech":"android"},function(err, result) {
    if (err) throw err;
    res.render("list",{result:result,proname:"Android",protype:"Major"});
  });
});

app.get("/projects/android/minor",function(req,res){
	project.find({"projecttype":"minor","projecttech":"android"},function(err, result) {
    if (err) throw err;
   res.render("list",{result:result,proname:"Android",protype:"Minor"});
    
  });
});



app.get("/projects/ios",function(req,res){
	project.find({"projecttech":"ios"},function(err, result) {
    if (err) throw err;
    res.render("list",{result:result,proname:"ios",protype:"All"});
    
  });
});

app.get("/projects/ios/major",function(req,res){
	project.find({"projecttype":"major","projecttech":"ios"},function(err, result) {
    if (err) throw err;
    res.render("list",{result:result,proname:"Android",protype:"Major"});
  });
});

app.get("/projects/ios/minor",function(req,res){
	project.find({"projecttype":"minor","projecttech":"ios"},function(err, result) {
    if (err) throw err;
   	res.render("list",{result:result,proname:"Android",protype:"Minor"});
    
  });
});


app.get("/projects/ruby",function(req,res){
	project.find({"projecttech":"ruby"},function(err, result) {
    if (err) throw err;
    res.render("list",{result:result,proname:"Ruby",protype:"All"});
    
  });
});

app.get("/projects/ruby/major",function(req,res){
	project.find({"projecttype":"major","projecttech":"ruby"},function(err, result) {
    if (err) throw err;
     res.render("list",{result:result,proname:"Ruby",protype:"Major"});
    
  });
});

app.get("/projects/ruby/minor",function(req,res){
	project.find({"projecttype":"minor","projecttech":"ruby"},function(err, result) {
    if (err) throw err;
     res.render("list",{result:result,proname:"Ruby",protype:"Minor"});
    
  });
});


app.get("/projects/.net",function(req,res){
	project.find({"projecttech":"net"},function(err, result) {
    if (err) throw err;
     res.render("list",{result:result,proname:".NET",protype:"All"});
    
  });
});

app.get("/projects/.net/major",function(req,res){
	project.find({"projecttype":"major","projecttech":"net"},function(err, result) {
    if (err) throw err;
    res.render("list",{result:result,proname:".NET",protype:"Major"});
    
  });
});

app.get("/projects/.net/minor",function(req,res){
	project.find({"projecttype":"minor","projecttech":"net"},function(err, result) {
    if (err) throw err;
    res.render("list",{result:result,proname:".NET",protype:"Minor"});
    
  });
});


app.get("/projects/php",function(req,res){
	project.find({"projecttech":"php"},function(err, result) {
    if (err) throw err;
    res.render("list",{result:result,proname:"PHP",protype:"All"});
    
  });
});

app.get("/projects/php/major",function(req,res){
	project.find({"projecttype":"major","projecttech":"php"},function(err, result) {
    if (err) throw err;
     res.render("list",{result:result,proname:"PHP",protype:"Major"});
  });
});

app.get("/projects/php/minor",function(req,res){
	project.find({"projecttype":"minor","projecttech":"php"},function(err, result) {
    if (err) throw err;
     res.render("list",{result:result,proname:"PHP",protype:"Minor"});
    
  });
});


app.get("/projects/sql",function(req,res){
	project.find({"projecttech":"sql"},function(err, result) {
    if (err) throw err;
     res.render("list",{result:result,proname:"SQL",protype:"All"});
  
  });
});

app.get("/projects/sql/major",function(req,res){
	project.find({"projecttype":"major","projecttech":"sql"},function(err, result) {
    if (err) throw err;
    res.render("list",{result:result,proname:"SQL",protype:"Major"});
    
  });
});

app.get("/projects/sql/minor",function(req,res){
	project.find({"projecttype":"minor","projecttech":"sql"},function(err, result) {
    if (err) throw err;
    res.render("list",{result:result,proname:"SQL",protype:"Minor"});
    
  });
});


app.get("/projects/full/stack/web",function(req,res){
	project.find({"projecttech":"fullstack"},function(err, result) {
    if (err) throw err;
    res.render("list",{result:result,proname:"Full Stack web Development",protype:"All"});
    
  });
});

app.get("/projects/full/stack/web/major",function(req,res){
	project.find({"projecttype":"major","projecttech":"fullstack"},function(err, result) {
    if (err) throw err;
     res.render("list",{result:result,proname:"Full Stack web Development",protype:"Major"});
    
  });
});

app.get("/projects/full/stack/web/minor",function(req,res){
	project.find({"projecttype":"minor","projecttech":"fullstack"},function(err, result) {
    if (err) throw err;
     res.render("list",{result:result,proname:"Full Stack web Development",protype:"Minor"});
    
  });
});

//=======================comment=======================

app.post("/comment/post/:id",function(req,res){
	
	Comment.create({
		id: req.params._id,
		username: req.user.username,
		title: req.body.comment,
	},function(err,comments){
		if(err){
			req.flash("nocomment","Something Went Wrong");
			return res.redirect("/");

			console.log(err);
		}
		res.redirect("/projects");




	});
});


//======================Show routes==================================

app.get("/account/project/:id",function(req,res){
	console.log(req.params.id);
	project.findById(req.params.id, function (err, user) {
        if (!user) {
            req.flash('error', 'No account found');
            return res.redirect('/account');
        }
        
      var req = https.get(url.parse(user.projectfile), function (res) {
  if (res.statusCode !== 200) {
    console.log(res.statusCode);
    // handle error
    return;
  }
  var data = [], dataLen = 0;

  // don't set the encoding, it will break everything !
  // or, if you must, set it to null. In that case the chunk will be a string.

  res.on("data", function (chunk) {
    data.push(chunk);
    dataLen += chunk.length;
  });

  res.on("end", function () {
    var buf = Buffer.concat(data);

    // here we go !
    JSZip.loadAsync(buf).then(function (zip) {
      return zip.file("content.txt");
    }).then(function (text) {
      console.log(text);
    });
  });
});

		


		//res.render("show",{foundproject:user});

       });
});




//=======================auth path===================  
app.post("/register",function(req,res){
	var newuser = new User({username:req.body.username,email:req.body.email,Imageurl:"http://stomatoloska-poliklinika-dr-knezevic.hr/wordpress/wp-content/uploads/2017/06/placeholder.jpg"});
	User.register(newuser,req.body.password,function(err,user){
		if(err){
			return res.render("signup");
			req.flash("notsignin",err.message);
		}

		passport.authenticate("local")(req,res,function(){
			req.flash("signup",req.body.username+" is signin successfully!!");
			res.redirect("/login");
		});
	});
});

//==================auth. login code==================

app.post("/login",passport.authenticate("local",{
			successRedirect:"/",
			failureRedirect : "/login"
}),function(req,res){
	req.flash("login",req.body.username+" is logged in");
	console.log("user login!!!");
});
//===============logout================

app.get("/logout",function(req,res){
	req.logout();
	req.flash("success","logout successfully!!");
	res.redirect("/");
});

function isloggedin(req,res,next){
	if(req.isAuthenticated()){
		return next();
	}
	req.flash("error","you should be login first!!");
	res.redirect("/login");
}


//===================mongodb start========================
mongoose.connect("mongodb://tulsi sharma:9992022386tulsi@ds113732.mlab.com:13732/dbugdb" ,{useNewUrlParser:true});

var db = mongoose.connection;
db.on('error',function(err){
	console.log("connection error",err);
});
db.once('open',function(){
	console.log("database connected");
});


app.listen(process.env.PORT || 3000,function()
{
	console.log('server is up and running on port 3000');
});