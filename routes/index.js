var express = require('express');
var router = express.Router();

var mongodb = require('mongodb').MongoClient;
var shortid = require('shortid');
var validurl = require('valid-url');
var bodyParser = require('body-parser');

var config = require('./config');

var dbname = 'urlshort';

router.use(bodyParser.urlencoded({ extended: true }));

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { placeHolderName: 'Enter Your Url', placeHolderEmail : "surajandraja@gmail.com"});
});

router.post('/generateShortId', function(req, res, next){
	//console.log(req.body.originalUrl);

	mongodb.connect('mongodb://' + config.db.host + '/' + config.db.name , function(error, client){
	if(error){
		throw error;
	}
	var db = client.db(dbname);
	console.log("Connected to the Database urlshort in POST method");

	var coll = db.collection('links');
	//var params = req.params.url;
	var params = req.body.originalUrl;
	var host = req.get('host') + '/';

	var dbFunction = function(db, callbackfunction){
	//find whether that data is already present inside my database. If its there , then it will give that JSON, otherwise document will give null
	coll.findOne({url : params},function(error, document){
		if(document !== null){
			//it means , data is already inside database. so ,it will give that doument as a JSON.
			//so, no need to push it again. Just print it on the screen.
			res.json({original_url : document.url , short_url : document.short });
		}
		else{
			//Data is not there . So, push it in the database
			var insertOnelink = {url : params , short : shortid.generate()};
			//first, check whether Url is valid or not.
			if(validurl.isUri(insertOnelink.url)){
			//coll.insert(insertOnelink);
			//console.log("ShortId : "+shortid.generate());
			if(coll.insert(insertOnelink)){
				//res.render('generateShortId', {oldUrl : params , newUrl : shortid.generate() });
				coll.findOne({url : params}, function(error, document){
					res.render('generateShortId', {oldUrl : document.url, newUrl : "http://localhost:3000/" + document.short})
				});
			}			
			//res.json({original_url : host + params , short_url : host + shortid.generate()});
			}
			else{
				console.log("Invalid Url");
				res.render('error', {invalidError : 'Invalid Url : Make Sure that your Url is correct'})
				//res.json({error : "Invalid Url : Make Sure that your Url is correct"});
			}
		}
	});

	};

	dbFunction(db, function(){
		db.close();
	});
	//res.send(params);
});
	});

router.get('/new/:url(*)', function(req, res, next){
	console.log(req.params.url);
	//res.send(req.params.url);
	//mongodb.connect('mongodb://127.0.0.1:27017', function(error, client){
	//mongodb.connect('mongodb://SurajKumar:surajkumar13@ds215370.mlab.com:15370/urlshort', function(error, client){
	mongodb.connect('mongodb://' + config.db.host + '/' + config.db.name , function(error, client){
	if(error){
		throw error;
	}
	var db = client.db(dbname);
	console.log("Connected to the Database urlshort");

	var coll = db.collection('links');
	var params = req.params.url;

	var host = req.get('host') + '/';

	var dbFunction = function(db, callbackfunction){
	//find whether that data is already present inside my database. If its there , then it will give that JSON, otherwise document will give null
	coll.findOne({url : params},function(error, document){
		if(document !== null){
			//it means , data is already inside database. so ,it will give that doument as a JSON.
			//so, no need to push it again. Just print it on the screen.
			res.json({original_url : document.url , short_url : document.short });
		}
		else{
			//Data is not there . So, push it in the database
			var insertOnelink = {url : params , short : shortid.generate()};
			//first, check whether Url is valid or not.
			if(validurl.isUri(insertOnelink.url)){
			coll.insert(insertOnelink);
			console.log("ShortId : "+shortid.generate());
			res.json({original_url : "localhost:3000/" + params , short_url : "localhost:3000/" + shortid.generate()});
			}
			else{
				console.log("Invalid Url");
				res.json({error : "Invalid Url : Make Sure that your Url is correct"});
			}
		}
	});

	};

	dbFunction(db, function(){
		db.close();
	});
	//res.send(params);
});

});

router.get('/:short' , function(req, res, next){
	//this routing is to retrieve the original url from the database with the particular shortid.
	//here , first of all we will connect to the database and will search for that shortid sent from the request.
	//if shortid matches with the short of database then, we  will redirect to the original url for that particular shortid.


	//mongodb.connect('mongodb://127.0.0.1:27017', function(error, client){
	//mongodb.connect('mongodb://SurajKumar:surajkumar13@ds215370.mlab.com:15370/urlshort', function(error, client){
	  mongodb.connect('mongodb://' + config.db.host + '/' + config.db.name , function(error, client){
		if(error){
			throw error;
		}
		console.log("Connected to the Database");
		var db = client.db(dbname);

		var collection = db.collection('links');
		var shortUrl = req.params.short;

		var findLink = function(db, callback){
			collection.findOne({short : shortUrl}, function(error, doc){
				if(doc !== null){
					//Redirect the requesting user-agent to the given absolute or relative url.
					res.redirect(doc.url);
				}
				else{
					res.json({error : "No Url found for that shortid. Please try the correct one !!!"});
				}
			});
		};

		findLink(db, function(){
			db.close();
		});
	});

});

module.exports = router;
