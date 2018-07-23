const express = require('express');
const exphbs = require('express-handlebars');
const path = require('path');
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');
const url = "mongodb://localhost:27017/";
var mongo = require('mongodb').MongoClient;
const async=require('async');
var assert = require('assert');

var phone = "";
var aboutuser = "";
var mail = "";
var collectionName = '';
var username = '';

const crypto = require('crypto');
const mongoose = require('mongoose');
const multer = require('multer');
const GridFsStorage = require('multer-gridfs-storage');
const Grid = require('gridfs-stream');
const methodOverride = require('method-override');
var vishaldb = '';



const mongoURI = url + vishaldb;

var allIngredientsName = [];
var allIngredientsQuantity = [];
var allIngredientsCalorie = [];

// Init App
var app = express();
app.set('port', (process.env.PORT || 2000));


//app.use(methodOverride('_method'));

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

var server=app.listen(app.get('port'), function(){
  console.log('Server started on port '+app.get('port'));
});

// View Engine
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(express.static("./public"));

// Set Static Folder
app.use(express.static(path.join(__dirname, 'public')));

app.get('/',function(req,res,next){
  res.render('index',{msg : ''});
});

app.get('/Register',function(req,res,next){
  res.render('register');
});

app.post('/users/register',function(req,res,next){
  var input1 = req.body.password;
  var input2 = req.body.password2;
  var input3 = req.body.username;
  if(input1 == input2){
    var item ={
    username : req.body.username,
    name : req.body.name,
    mail : req.body.mail,
    phone : req.body.phone,
    password : req.body.password,
    aboutuser : req.body.about
  }
  console.log(item);
  mongo.connect(url,function(err,db){
    assert.equal(null, err);
    const dbo = db.db(input3);
    dbo.collection(input3).insertOne(item, function(err, res) {
      assert.equal(null, err);
      console.log('User Created');
      db.close();
    });
  });
  vishaldb = input3;
  res.redirect('/dashboard');
}
});

app.post('/users/login',function(req,res,next){
  var input1 = req.body.username;
  var input2 = req.body.password;
  console.log(input1 + " ##" + input2);
  mongo.connect(url,function(err,db){
    assert.equal(null, err);
    const dbo = db.db(input1);
    dbo.collection(input1).find({"username" : input1,"password" : input2}).toArray(function(err,result){
      console.log("sucessfulle logged in");
      vishaldb = input1;
    });
  });
  res.redirect('/dashboard');
});

app.get('/logout',function(req,res,next){
  res.render('index',{msg : "You have Suceesully Logged-Out"});
})

app.get('/dashboard',function(req, res){

mongo.connect(url, function(err, db) {
  if (err) console.log("error recieved");
  const dbo = db.db(vishaldb);
  dbo.collection(vishaldb).findOne({}, function(err, result) {
    if (err) console.log('Error detected');
    try{
      if(result.username)username = result.username;
    }
    catch(e){};
    try{
      if(result.phone)phone = result.phone;
    }
    catch(e){};
    try
    {

      if(result.mail)mail = result.mail;
    }
    catch(e){};
    try
    {
      if(result.aboutuser)aboutuser = result.aboutuser;
    }
    catch(e){};
      res.render('dashboard',{
      username : username,
      mail : mail,
      phone : phone,
      about : aboutuser
    });
    console.log(result);
    db.close();
  });
});

});

app.get('/visit',function(req,res,next){
  res.render('recipe',{
    username : "Vishal260700"
  });
});


app.post('/search', function(req, res, next){
  var total = 0;
  var input = req.body.searchbar;
  collectionName = input;
   mongo.connect(url, function(err, db) {
    assert.equal(null, err);
    const dbo = db.db(vishaldb);
    dbo.collection(input).find({}).toArray(function(err,result){
      console.log(result[0]['ingredient'][0]);
      var i = result[0]['ingredient'].length;
      for(var x = 0 ; x < i ; x++){
        allIngredientsName[x] = result[0]['ingredient'][x]['ingredientName'];
        allIngredientsCalorie[x] = result[0]['ingredient'][x]['ingredientCalories'];
        allIngredientsQuantity[x] = result[0]['ingredient'][x]['ingredientQuantity'];
        total = total + parseInt(result[0]['ingredient'][x]['ingredientCalories']);
      }
      console.log(total);
      console.log(allIngredientsQuantity);
      console.log(allIngredientsName);
      console.log(allIngredientsCalorie);
      //console.log(result[0]['recipeImage']);
      res.render('recipe',{username : "Vishal260700",query : result[0]['Dish'],calorie : total,rating : result[0]['rating'],DishName : result[0]['Dish'],date : result[0]['Date'],inamei : allIngredientsName,iquantityi : allIngredientsQuantity,icaloriesi : allIngredientsCalorie,aboutDish : result[0]['about']});
      db.close();
    });
});
});

// Middleware
app.use(methodOverride('_method'));


// Create mongo connection
const conn = mongoose.createConnection(mongoURI);

// Init gfs
let gfs;

console.log(vishaldb + "#######################################")

conn.once('open', () => {
  // Init stream
  gfs = Grid(conn.db, mongoose.mongo);
  gfs.collection('db1');
});

// Create storage engine
const storage = new GridFsStorage({
  url: mongoURI,
  file: (req, file) => {
    return new Promise((resolve, reject) => {
      crypto.randomBytes(16, (err, buf) => {
        if (err) {
          return reject(err);
        }
        const filename = buf.toString('hex') + path.extname(file.originalname);
        const fileInfo = {
          filename: filename,
          bucketName: "db1"
        };
        resolve(fileInfo);
      });
    });
  }
});
const upload = multer({ storage });

// @route GET /
// @desc Loads form
app.get('/gallery', (req, res) => {
  gfs.files.find().toArray((err, files) => {
    // Check if files
    if (!files || files.length === 0) {
      res.render('gallery', { files: false });
    } else {
      files.map(file => {
        if (
          file.contentType === 'image/jpeg' ||
          file.contentType === 'image/png'
        ) {
          file.isImage = true;
        }else{
          file.isImage = false;
        } 

        if (file.contentType === 'audio/mp3') {
          file.isAudio = true;
        } else {
          file.isAudio = false;
        }

        if (file.contentType === 'video/mp4') {
          file.isVideo = true;
        } else {
          file.isVideo = false;
        }
      });
      res.render('gallery', { files: files,username : "vishal260700" });
    }
  });
});

// @route POST /upload
// @desc  Uploads file to DB
app.post('/upload', upload.single('file'), (req, res) => {
  // res.json({ file: req.file });
  res.redirect('/gallery');
});

// @route GET /files
// @desc  Display all files in JSON
app.get('/files', (req, res) => {
  gfs.files.find().toArray((err, files) => {
    // Check if files
    if (!files || files.length === 0) {
      return res.status(404).json({
        err: 'No files exist'
      });
    }

    // Files exist
    return res.json(files);
  });
});

// @route GET /files/:filename
// @desc  Display single file object
app.get('/files/:filename', (req, res) => {
  gfs.files.findOne({ filename: req.params.filename }, (err, file) => {
    // Check if file
    if (!file || file.length === 0) {
      return res.status(404).json({
        err: 'No file exists'
      });
    }
    // File exists
    return res.json(file);
  });
});

app.get('/any/:filename', (req, res) => {
  gfs.files.findOne({ filename: req.params.filename }, (err, file) => {
    // Check if file
    if (!file || file.length === 0) {
      return res.status(404).json({
        err: 'No file exists'
      });
    }
    console.log("---------------------" + file.contentType + "-----------------------");
    // Check if image
    if (file.contentType === 'image/jpeg' || file.contentType === 'image/png') {
      // Read output to browser
      const readstream = gfs.createReadStream(file.filename);
      readstream.pipe(res);
    }else{
    if (file.contentType === 'audio/mp3') {
      const readstream = gfs.createReadStream(file.filename);
      readstream.pipe(res);
    }else {
        if (file.contentType === 'video/mp4') {
        const readstream = gfs.createReadStream(file.filename);
        readstream.pipe(res);
        }else {
        res.status(404).json({
          err: 'There is some kind of error'
        });
        }
      }
    }
  });
});



// @route DELETE /files/:id
// @desc  Delete file
app.delete('/files/:id', (req, res) => {
  gfs.remove({ _id: req.params.id, root: "db1" }, (err, gridStore) => {
    if (err) {
      return res.status(404).json({ err: err });
    }

    res.redirect('/gallery');
  });
});



app.get('/contact',function (req, res) {
  res.render('contact',{
    username : vishaldb,//add the username which will be retrieved after validation by login form
    query : 'Contact Form'
  });
});


app.post('/update', function(req, res, next) {
  var item = {
    phone : req.body.phone,
    aboutuser : req.body.aboutuser,
    mail : req.body.mail
  };
  console.log(item);
  mongo.connect(url, function(err, db) {
    assert.equal(null, err);
    const dbo = db.db(vishaldb);
    dbo.collection(vishaldb).updateOne({"username":vishaldb},{$set: item}, function(err, res) {
      assert.equal(null, err);
      console.log('Item updated');
      db.close();
    });
  });
  res.redirect('/dashboard');
});

app.post('/rate', function(req, res, next) {
  var item = {
    rating : req.body.rating
  };
  console.log(item);
  mongo.connect(url, function(err, db) {
    assert.equal(null, err);
    const dbo = db.db(vishaldb);
    dbo.collection(collectionName).updateOne({},{$set: item}, function(err, res) {
      assert.equal(null, err);
      console.log('Item Deleted');
      db.close();
    });
  });
  res.redirect('/dashboard');
});

app.post('/add', function(req, res, next) {
  var mydate = new Date();
  var year = mydate.getYear();
  if(year < 1000){
    year = year + 1900;
  }
  var day = mydate.getDay();
  var month = mydate.getMonth();
  var date = mydate.getDate();
  var dayarray = new Array("Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday");
  var montharray = new Array("Jan","Feb","Mar","April","May","June","July","Aug","Sept","Oct","Nov","Dec");

  var makeDate = "" + dayarray[day]+" | " + "" + date + " " + montharray[month] + " " + year;

  var item = {
    Dish : req.body.dish,
    rating : req.body.rating,
    about : req.body.about,
    Date : makeDate,
    ingredient : [{ingredientName : req.body.iname, ingredientQuantity : req.body.iquantity,ingredientCalories : req.body.icalories}]
  };
  console.log(item);
  mongo.connect(url, function(err, db) {
    assert.equal(null, err);
    const dbo = db.db(vishaldb);
    dbo.createCollection(req.body.dish,function(err,res){
      if (err) throw err;
      console.log("Collection created!");
    });

    dbo.collection(req.body.dish).insertOne(item, function(err, res) {
      assert.equal(null, err);
      console.log('Item inserted');
      db.close();
    });
  });
  res.redirect('/dashboard');
});

app.post('/aboutDish',function(req,res,next){
  var item = {
    about : req.body.aboutD
  };
  console.log(item);
  mongo.connect(url, function(err, db) {
    assert.equal(null, err);
    const dbo = db.db(vishaldb);
    dbo.collection(collectionName).updateOne({},{$set: item}, function(err, res) {
      assert.equal(null, err);
      console.log('Item Deleted');
      db.close();
    });
  });
  res.redirect('/dashboard');
});


app.post('/ingdel',function(req,res,next){
    var item = {
      ingredientName : req.body.ing
    };
  console.log(item);
  mongo.connect(url,function(err,db){
    assert.equal(null,err);
    const dbo = db.db(vishaldb);
    dbo.collection(collectionName).findOneAndUpdate({},{$pull : {ingredient : item}} ,function(err,obj){
      if (err) throw err;
      console.log("1 document deleted");
      db.close();
    });
  });
  res.redirect('/dashboard');
});

app.post('/updateing',function(req,res,next){
  var item1 = {
      ingredientName : req.body.ingredient
    };

  var item2 = {
    ingredient : {ingredientName : req.body.ingredient, ingredientQuantity : req.body.quantity,ingredientCalories : req.body.calories}
  };

  console.log(item1);

  console.log(item2);

  mongo.connect(url,function(err,db){
    assert.equal(null,err);
    const dbo = db.db(vishaldb);
    dbo.collection(collectionName).findOneAndUpdate({},{$pull : {ingredient : item1}} ,function(err,obj){
      if (err) throw err;
      console.log("1 document deleted");
      db.close();
    });
  });

  mongo.connect(url, function(err, db) {
    assert.equal(null, err);
    const dbo = db.db(vishaldb);
    dbo.collection(collectionName).updateOne({},{$addToSet: item2}, function(err, res) {
      assert.equal(null, err);
      console.log('Item Updated');
      db.close();
    });
  });
  res.redirect('/dashboard');
});

app.post('/adding', function(req, res, next) {
  var item = {
    ingredient : {ingredientName : req.body.ingredient, ingredientQuantity : req.body.quantity,ingredientCalories : req.body.calories}
  };
  console.log(item);
  mongo.connect(url, function(err, db) {
    assert.equal(null, err);
    const dbo = db.db(vishaldb);
    dbo.collection(collectionName).updateOne({},{$addToSet: item}, function(err, res) {
      assert.equal(null, err);
      console.log('Item Updated');
      db.close();
    });
  });
  res.redirect('/dashboard');
});

app.post('/delete2',function(req,res,next){
  mongo.connect(url, function(err, db) {
  if (err) throw err;
  var dbo = db.db(vishaldb);
  dbo.dropCollection(collectionName, function(err, delOK) {
    if (err) throw err;
    if (delOK) console.log("Collection deleted");
    db.close();
  });
});
  res.redirect('/dashboard');
});


app.post('/recipeImage',function(req,res,next){
  var item1 = {
    recipeImage : req.body.file
  }
  console.log(item1);
  mongo.connect(url,function(err,db){
    assert.equal(null,err);
    const dbo = db.db(vishaldb);
    dbo.collection(collectionName).updateOne({},{$set: item1}, function(err, res) {
      assert.equal(null, err);
      console.log('Image Updated');
      db.close();
    });
});
  res.redirect('/dashboard');
});

app.post('/send', (req, res) => {
  const output = `
  <center>
  <div style = "background:#EAFAF1;width:60%;">
  <h3 style="font-size:40px;color: black;padding-top: 20px;">Contact Details</h3>
  <style>
    td{
      padding : 10px;
      width: 5%;
      font-size:20px;
    }
  </style>
<div style="background:#EAFAF1;">
  <table style="padding-bottom:30px;padding-right: 10px;padding-left: 10px;">
    <tr style="background: #EAEDED;">
      <td>
        Name
      </td>
      <td>
        ${req.body.name}
      </td>
    </tr>
    <tr style="background: white;">
      <td>
        Company
      </td>
      <td>
        ${req.body.company}
      </td>
    </tr>
    <tr style="background: #EAEDED;">
      <td>
        Mail Id
      </td>
      <td>
        ${req.body.email}
      </td>
    </tr>
    <tr style="background: white;">
      <td>
        Phone Number
      </td>
      <td>
        ${req.body.phone}
      </td>
    </tr>
    <tr style="background: #EAEDED;">
      <td>
        Message
      </td>
      <td>
        ${req.body.message}
      </td>
    </tr>
  </table>
</div>
</div>
</center>
  `;

  // create reusable transporter object using the default SMTP transport
  let transporter = nodemailer.createTransport({
    service: 'gmail',
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
        user: 'resturantev1@gmail.com', // generated ethereal user
        pass: 'versionnumber1'  // generated ethereal password
    },
    tls:{
      rejectUnauthorized:false
    }
  });

  // setup email data with unicode symbols
  let mailOptions = {
      from: 'resturantev1@gmail.com', // sender address
      to: 'vishal260700@gmail.com', // list of receivers
      subject: 'Resturante Contact Request', // Subject line
      text: '', // plain text body
      html: output // html body
  };

  // send mail with defined transport object
  transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
          return console.log(error);
      }
      console.log('Message sent: %s', info.messageId);   
      console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));

      res.redirect('/dashboard');
  });
  });