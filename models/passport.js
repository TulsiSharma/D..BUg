var localstrategy= require("passport-local");
var passport = require("passport");
const GoogleStrategy = require('passport-google-oauth20').Strategy;
var mongoose = require("mongoose");
var User     = require('../models/user');
//const User = mongoose.model('users');
passport.initialize();
module.exports = function(passport){
  passport.use(new GoogleStrategy({
      clientID: "754810812848-pvvh8g4enfm9erofu9phoqe0vjcqrl3n.apps.googleusercontent.com",
      clientSecret:"4VpPb5xhTTYiFpIhGIZXV5Yc",
      callbackURL:"http://localhost:3000/auth/google/callback",
      proxy: true
    }, async (accessToken, refreshToken, profile, done) => {
       //console.log(accessToken);
     // Check for existing user
            
           // if (id.match(/^[0-9a-fA-F]{24}$/)) {
  // Yes, it's a valid ObjectId, proceed with `findById` call.
            await User.findOne({googleID: profile.id}).then(user => {
                  if(user){
                      // Return user
                      done(null, user);
                  } 
                 else {
                  console.log("not found!!!!");
                    // if the user isnt in our database, create a new user
                    const image = profile.photos[0].value.substring(0, profile.photos[0].value.indexOf('?'));
                    var first=profile.name.givenName;
                    var second= profile.name.familyName;
                    const newUser = {
                        id: profile.id,
                        username: first+" "+second,
                        email: profile.emails[0].value,
                        Imageurl: image
                      }
                      console.log(newUser);
                    // save the user
                        User(newUser).save().then(user => done(null, user));
                }
            });
         // }
    }));
      passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  passport.deserializeUser((id, done) => {
    User.findById(id).then(user => done(null, user));
  });
};