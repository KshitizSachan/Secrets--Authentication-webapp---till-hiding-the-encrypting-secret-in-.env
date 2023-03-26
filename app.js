//jshint esversion:6
require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require('mongoose');
const session = require('express-session');
var passport = require("passport");
var passportLocalMongoose = require("passport-local-mongoose");
const { response } = require('express');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require('mongoose-findorcreate');

// const encrypt= require("mongoose-encryption");
// const md5=require("md5");

// const bcrypt=require("bcrypt");
// const saltRounds=12;


const app = express();

app.use(express.static("public"));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({
  extended: true
}));

app.use(session({
    secret: "I will find you, and I will kill you.",
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

mongoose.set('strictQuery', true);
mongoose.connect("mongodb+srv://<username>:<password>@cluster0.cacxhu4.mongodb.net/userDB");

const userSchema=new mongoose.Schema({
    email: String,
    password: String,
    googleId: String,
    secret: String
});
// userSchema.plugin(encrypt, { secret: process.env.SECRET, encryptedFields: ["password"] });
userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

const User=new mongoose.model("User", userSchema);

passport.use(User.createStrategy());

// used to serialize the user for the session
passport.serializeUser(function(user, done) {
    done(null, user.id); 
   // where is this user.id going? Are we supposed to access this anywhere?
});

// used to deserialize the user
passport.deserializeUser(function(id, done) {
    User.findById(id, function(err, user) {
        done(err, user);
    });
});

passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets",
    userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo" // Try removing it maybe it works
  },
  function(accessToken, refreshToken, profile, cb) {
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));

app.listen(3000, function() {
  console.log("Server started on port 3000");
});

app.get("/",function(req,res){
    res.render("home");
});

app.get("/login",function(req,res){
    res.render("login");
});

app.get("/register",function(req,res){
    res.render("register");
});

app.get("/logout", function(req,res){
    req.session.destroy(function(err){
        res.redirect("/");
    });
});

app.get("/secrets", function(req,res){
    // if(req.isAuthenticated()){
    //     res.render("secrets");
    // }else{
    //     res.redirect("/login");
    // }

    User.find({"secret": {$ne: null}}, function(err, foundUser){
        if(err){
            console.log(err);
        }else{
            if(foundUser){
                res.render("secrets", {usersWithSecrets: foundUser});
            }
        }
    });
});

app.get("/submit", function(req,res){
    if(req.isAuthenticated()){
        res.render("submit");
    }else{
        res.redirect("/login");
    }
});

app.post("/submit", function(req,res){
    const submittedSecret= req.body.secret;

    User.findById(req.user.id, function(err, foundUser){
        if(err){
            console.log(err);
        }else{
            if(foundUser){
                foundUser.secret= submittedSecret;
                foundUser.save(function(){
                    res.redirect("/secrets");
                });
            }
        }
    });
});

app.get('/auth/google',
  passport.authenticate('google', { scope: ['profile'] }));

  app.get("/auth/google/secrets",
  passport.authenticate('google', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect secrets.
    res.redirect('/secrets');
  });
  


// app.post("/register", function(req,res){

    // Creating a new user
    // const newUser=new User({
    //     email: req.body.username,
    //     password: md5(req.body.password)
    // });


    // bcrypt.hash(req.body.password, saltRounds, function(err, hash) {
    //     const newUser=new User({
    //         email: req.body.username,
    //         password: hash
    //     });
    //     newUser.save(function(err){
    //         if(err)
    //         console.log(err);
    //         else
    //         res.render("secrets");
    //     });
    // });

// });


// app.post("/login", function(req,res){
    
    // const password=md5(req.body.password);

    
    // const password=req.body.password;

    // User.findOne({email: username}, function(err, foundUser){
    //     if(err)
    //     console.log(err);
    //     else
    //     {
    //         if(foundUser)
    //         {
    //             bcrypt.compare(password, foundUser.password, function(err, result) {
    //                 if(result===true)
    //                 res.render("secrets");
    //             });
                
    //         }
    //     }
    // });

// });


app.post("/register", function(req,res){
    User.register({username: req.body.username}, req.body.password, function(err, user){
        if(err){
            console.log(err);
            res.redirect("/register");
        }else{
            passport.authenticate("local")(req,res, function(){
                res.redirect("/secrets");
            });
        }
    });
});


app.post("/login", function(req,res){
    const user=new User({
        username: req.body.username,
        password: req.body.password
    });

    req.login(user, function(err){
        if(err)
        console.log(err);
        else{
            passport.authenticate("local")(req,res, function(){
                res.redirect("/secrets");
            });
        }
    });
});

