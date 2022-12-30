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
mongoose.connect("mongodb+srv://kshitiz:9450603282@cluster0.cacxhu4.mongodb.net/userDB");

const userSchema=new mongoose.Schema({
    email: String,
    password: String
});
// userSchema.plugin(encrypt, { secret: process.env.SECRET, encryptedFields: ["password"] });
userSchema.plugin(passportLocalMongoose);

const User=new mongoose.model("User", userSchema);

passport.use(User.createStrategy());

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

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
    if(req.isAuthenticated()){
        res.render("secrets");
    }else{
        res.redirect("/login");
    }
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

