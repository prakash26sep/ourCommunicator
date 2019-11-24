//Using the various libraries installed using node package manager
var PORT= process.env.PORT || 5000;

var express=require("express"); 
var bodyParser=require("body-parser"); 
const path = require('path');
var session = require('express-session');
const mongoose = require('mongoose');
var ObjectId = require('mongodb').ObjectID;

//Importing mongoose schema
var postsBySchema = require('./models/posts');


//Connecting it to the mongodb with DB 'gfg'
mongoose.Promise= global.Promise;
mongoose.connect('mongodb+srv://prakash26sep:tatasky1@ourcommmunicatordata-yoagc.mongodb.net/test?retryWrites=true&w=majority', {useNewUrlParser: true});
var db=mongoose.connection; 
db.on('error', console.log.bind(console, "connection error")); 
db.once('open', function(callback){ 
    console.log("connection succeeded"); 
}); 


//invoking express and storing as reference to 'app' 
var app=express(); 


//Setting the ejs view engine to folder 'views'
app.set("view engine", "ejs");
app.set("views", __dirname + "/views");
app.set("view option", {layout: false});


//using the middlewares which can communicate to both request and response
app.use(bodyParser.json()); 
app.use(express.static('public')); 
app.use(bodyParser.urlencoded({ 
    extended: true
})); 


//Creating a session
app.use(session({
    secret: "secret",
    resave: true,
    saveUninitialized: true
}));


//The root route
app.get('/',function(req,res){ 
    res.set({ 
        'Access-control-Allow-Origin': '*'
        }); 
    res.sendFile(path.join(__dirname +'/public' +'/index.html'));

});


//Here when the '/signup' is hit with post request the function takes the body
// parameters and stores it to the js variables and 
//checks stores it to the db 
app.post('/sign_up', function(req,res){ 
    
    var name = req.body.name; 
    var email =req.body.email; 
    var pass = req.body.password; 
    var phone =req.body.phone; 
  
    var data = { 
        "name": name, 
        "email":email, 
        "password":pass, 
        "phone":phone 
        };
        
    userAlreadyExistsChecker= {
        email
    }

        db.collection('details').findOne(userAlreadyExistsChecker, function(err, user){ 

            if(user === null){
                    console.log("User found");
                    db.collection('details').insertOne(data, function(err, collection){ 
                        if (err) throw err; 
                        console.log("Record inserted Successfully"); 
                    }); 

                    //res.redirect('signup_success.html'); 
                    res.render('login', {"message": "Successfully Registered!", "error": ""});
            }
            
            else{
                 console.log("User Already exists");
                 res.render('login', {"error": "Email Id already in use..Please try to login", "message": ""});
            }

            });
}); 
var nameUserr;


//login checks for the email and password from db 
app.post('/log_in', function(req,res){ 

    var login_email =req.body.email; 
    var login_pass = req.body.password; 
    //var phone =req.body.phone; 
  
    var check = { 
        "email":login_email, 
        "password":login_pass,  
        }; 

    db.collection('details').findOne(check, function(err, user){ 

        if(user === null){
            console.log("User not found");
            res.render('login', {"error": "Email or password is incorrect! Please try again..", "message": ""});
            }
        
        else{
            console.log("User found");
            //console.log(user);
            req.session.email= login_email;

            var nameChecker={
                "email": req.session.email
            };
        
            db.collection('details').find(nameChecker).project({"name": 1, "_id": 0}).toArray( function(err, nameByEmail){ 
                console.log('Inside name checker');
                if(err) throw err;
                console.log(nameByEmail[0].name);
                req.session.name= nameByEmail[0].name;
                
                nameUserr= nameByEmail[0].name;

                res.redirect('/home');

            });

        } 
    }); 
          
});

/*
//Sending the '/home' to login_success.ejs
app.get('/home',function(req,res){ 
        res.set({ 
        'Access-control-Allow-Origin': '*'
        }); 
        
        res.render('home', { "name": req.session.name });
    
});
*/


//Sending the '/contact' to contact.ejs
app.get('/contact',function(req,res){ 
    res.set({ 
    'Access-control-Allow-Origin': '*'
    }); 
    
    res.render('contact', { email: req.session.email });

});

app.get('/contactWithoutLogin',function(req,res){ 
    res.set({ 
    'Access-control-Allow-Origin': '*'
    }); 
    
    res.render('contactWithoutLogin');

});


//View Profile from readPost page
app.get('/viewProfile/:emailId',function(req,res){ 
    res.set({ 
        'Access-control-Allow-Origin': '*'
        }); 

        var emailFromURL= req.params.emailId;

        var profileVariables={
            "email": emailFromURL
        };
    
        db.collection('details').find(profileVariables).project({"name": 1, "email": 1,"phone": 1}).toArray( function(err, profileNavigate){ 
            console.log('Inside name checker');
            if(err) throw err;
            var profileName= profileNavigate[0].name;
            var profileEmail= profileNavigate[0].email;
            var profilePhone= profileNavigate[0].phone;
            var profileId= profileNavigate[0]._id;


            res.render('viewProfile.ejs', {
                "emailId": profileEmail,
                "name": profileName,
                "phone": profilePhone,
                "id": profileId
            });

        });
        
});


//Sending '/login' hit to the the login.html    
app.get('/login',function(req,res){ 
    res.sendFile(path.join(__dirname+ "/public"+'/login.html'));
});


//Sending '/login' hit to the the login.html    
app.get('/signup',function(req,res){ 
    res.sendFile(path.join(__dirname+ "/public"+'/signup.html'));
});


//Sending 'addPost' hit to the the addPost.html
app.get('/home/addPost', function(req, res){
    res.sendFile(path.join(__dirname+ "/public" +"/addPost.html"));
});


//Sending '/logout' to destroy session and sending it back to the index page' hit to the the login.html    
app.get('/logout',function(req,res){ 
    req.session.destroy();
    console.log('Session destroyed');
    res.redirect('/');
    });


//Rendering the 'readPost.ejs' from the views
app.get('/myPosts', function(req, res, next){
    
    db.collection('posts').find({}).toArray().then( posst =>{ 

            console.log("Came to the readpost fetching");

            res.render('myPosts', {
                name: nameUserr,
                posst: posst,
                email: req.session.email
            });
    });
});


//Rendering the 'readPost.ejs' from the views
app.get('/home', function(req, res, next){
    
    db.collection('posts').find({}).toArray().then( posst =>{ 

            console.log("Came to the readpost fetching");
            
            //console.log(posst);


            res.render('readPost', {
                name: nameUserr,
                posst: posst,
                email: req.session.email,
                name: req.session.name
            });

    });

});


//Changing wow
app.get('/changingWow', function(req, res, next){
    
    db.collection('posts').find({}).toArray().then( posst =>{ 

            console.log("Inside changing wow");
            
            res.render('readPost', {
                email: nameUserr,
                posst: posst
            });
            
    });

});


//Chatting with other members and fetching chat
app.get('/chat', function(req, res, next){
    
    db.collection('details').find({}).toArray().then( person =>{ 

            console.log("Came to the readpost fetching");

            res.render('chatWithUsers', {
                'email': req.session.email,
                'name': req.session.name,
                'person': person
            });

    });

});


//Sending message to other user
app.post('/sendMessage/', function(req, res, next){
    
    //Inserting chat data to DB
    var chatDetails= {
        "loggedUser": req.session.email,
        "loggedUserName": req.session.name,
        "otherUser": req.session.otherUser,
        "date": formatAMPM(),
        "otherUserName": req.session.otherUserName,
        "message": req.body.message
    };
  
    db.collection('chatdatatest').insertOne(chatDetails, function(err, collection){ 
        if (err) throw err; 
        console.log("Chat data inserted Successfully"); 
    }); 
   
    //res.redirect('/chat');
    //res.redirect('back');
    res.redirect('back');


});

//Commenting on the post
app.post('/home/comment/:id', function(req, res, next){
    
    //Inserting chat data to DB
    var commentDetails= {
        "email": req.session.email,
        "name": req.session.name,
        "date": formatAMPM(),
        "comment": req.body.comment
    };
  
    db.collection('posts').updateOne({_id:ObjectId(req.params.id) },
        {
        $push: {
          "comments": 
             commentDetails       
        }
   
        }
    , function(err, collection){ 
        if (err) throw err; 
        console.log("comment data inserted Successfully"); 
    }); 

   
    //res.redirect('/chat');
    //res.redirect('back');
    res.redirect('back');


});

//Chatting with other members
app.get('/startChatting/:otherUser/:otherUserName', function(req, res, next){
    
    //Combination of OR and AND 
    db.collection('chatdatatest').find({$or : [
        { 
          $and : [ 
                  {"loggedUser" : req.session.email},
                  {"otherUser" : req.params.otherUser}
                ]
        },

        { 
          $and : [ 
                  {"otherUser" : req.session.email},
                  {"loggedUser" : req.params.otherUser}
                ]
        }
        
      ] }).toArray().then( chatdata =>{

            console.log("Users chat fetched");

            res.render('chatting', {
                'chatdata': chatdata,
                'loggedUserId': req.session.email
            });

    });

    req.session.otherUser= req.params.otherUser;
    req.session.otherUserName= req.params.otherUserName;

});


//Function for adding a post
app.post('/addPost', function(req,res){ 
 
    var postText = req.body.addPost;
    var nameChecker={
        "email": req.session.email
    };

    db.collection('details').find(nameChecker).project({"name": 1, "_id": 0}).toArray( function(err, nameByEmail){ 
        console.log('Inside name checker');
        if(err) throw err;
        //res.json(nameByEmail);
        
        //console.log(nameByEmail[0].name);
        //req.session.nameOfUser= nameByEmail[0].name;

        var postDetails= {
            "postText": postText,
            "email": req.session.email,
            "name": req.session.name,
            "date": formatAMPM(),
            "wows": 0,
            "comments":[],
            "wowers":[]
        };
      
        db.collection('posts').insertOne(postDetails, function(err, collection){ 
            if (err) throw err; 
            console.log("Post inserted Successfully"); 
        }); 
    
        //res.render('home', { "email": req.session.nameOfUser, "name": req.session.name });
        res.redirect('/home');
              
    });
        
}); 


//Changing the value of Wow to DB
app.post('/home/readPost/:id/:operator', function(req, res){

    postsBySchema.findById(req.params.id, function(err, theUser){

            if(err){
                console.log(err);
            }
            else{

                if(req.params.operator == "add"){
                    theUser.wows= parseInt(theUser.wows+ 1);
                    theUser.wowers.push(req.session.email);
                    theUser.save();
                }
                if(req.params.operator == "sub"){
                    theUser.wows= parseInt(theUser.wows- 1);
                    theUser.wowers.pull(req.session.email);
                    theUser.save();
                }
                
                res.status(204).send();
            }
        
    });


});


//Functions used in this App

//-- Date function
function formatAMPM() {
    var d = new Date(),
        minutes = d.getMinutes().toString().length == 1 ? '0'+d.getMinutes() : d.getMinutes(),
        hours = d.getHours().toString().length == 1 ? '0'+d.getHours() : d.getHours(),
        ampm = d.getHours() >= 12 ? 'pm' : 'am',
        months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'],
        days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
    return months[d.getMonth()]+' '+d.getDate()+', '+d.getFullYear()+' - '+hours+':'+minutes+ampm;
}


//assigning the port
app.listen(PORT,function(){
    console.log("Live at Port 3000");
});
