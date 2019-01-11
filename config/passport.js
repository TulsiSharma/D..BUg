var localstrategy= require("passport-local");
var GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;
var mongoose = require("mongoose");
const User = mongoose.model("users",newuser);

module.exports = function(passport){
  passport.use(
    new GoogleStrategy({
      clientID: "754810812848-pvvh8g4enfm9erofu9phoqe0vjcqrl3n.apps.googleusercontent.com",
      clientSecret:"4VpPb5xhTTYiFpIhGIZXV5Yc",
      callbackURL:"http://localhost:3000/auth/google/callback",
      proxy: true
    }, (accessToken, refreshToken, profile, done) => {
       //console.log(accessToken);
      // console.log(profile);

      const image = profile.photos[0].value.substring(0, profile.photos[0].value.indexOf('?'));
      
      const newUser = {
        googleID: profile.id,
        firstName: profile.name.givenName,
        email: profile.emails[0].value,
        password: profile.password.value,
        image: image
      }
      // Check for existing user
      User.findOne({
        googleID: profile.id
      }).then(user => {
        if(user){
          // Return user
          done(null, user);
        } else {
          // Create user
          new User(newUser)
            .save()
            .then(user => done(null, user));
        }
      })
    })
  );

  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  passport.deserializeUser((id, done) => {
    User.findById(id).then(user => done(null, user));
  });
};