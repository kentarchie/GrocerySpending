var express  = require("express")
	,mongodb = require("mongodb")
   ,http = require('http')
   ,path = require('path')
	,fs = require("fs");

var MongoClient = mongodb.MongoClient;
	
var app = express();
var URI = "mongodb://localhost:27017/GrocerySpending";
var DBConnection = null;

if(app == undefined) {
	console.log('app undefined');
}
if(app.configure == undefined) {
	console.log('app.configure undefined');
}

app.set('port', process.env.PORT || 3000);
app.use(express.static(path.join(__dirname, 'static')));

//app.configure(function(){
//  app.set('port', process.env.PORT || 3000);
//  app.use(express.static(path.join(__dirname, 'static')));
//});

app.get('/', function(req, res){
  res.render('index', {
    title: 'Home'
  });
});

app.get('/about', function (req, res)
{
  res.send('Grocery Spending Recorder');
});

app.get('/GetStores', function (req, res)
{
	console.log('Starting GetStores');
	writeJSONHeader(res);

	//ConnectToDB(res);
	MongoClient.connect(URI, function (err, DBConnection) {
		if (err) {
			console.log('Unable to connect to the mongoDB server. Error:', err);
			res.write('{"returncode" : "fail","message" : "GrocerySpending connect failed"}');
			res.end();
			return;
		} 

		if(!DBConnection || (DBConnection == undefined) || DBConnection == null) {
			console.log('DBConnection null');
			res.write('{"returncode" : "fail","message" : "GrocerySpending DBConnect null"}');
			res.end();
			return;
      }

		var collection = DBConnection.collection('NameValue');
		if(!collection || (collection == undefined)) {
			console.log("There was an error attaching to GrocerySpending:NameValue.");
			console.log("DBConnection.NameValue=:"+DBConnection.NameValue+":");
			res.write('{"returncode" : "fail","message" : "GrocerySpending.NameValue missing"}');
			res.end();
			return;
      }
		console.log("NameValue found, collection OK");
      var results = {};
	
		collection.find({}).toArray(function (err, records) {
			if(err) {
				console.log("There was an error executing the database query.");
				res.write('{"returncode" : "fail","message" : "NameValue Find Failed"}');
				res.end();
				return;
			}
			results['returncode']  =  'pass';
			console.log('records.length = :'+records.length+':')

         var storesList = [];
			for(var i=0,il=records.length; i<il; ++i) {
            var item = {};
				if(records[i]['name'] == 'store')
            storesList.push(records[i]['value']);
			   results['StoreList'] = storesList;
			}
			res.write(JSON.stringify(results,null,'\n'));
			res.end();
		});
  });
}); // GetStores

app.get('/GetTags', function (req, res)
{
	writeJSONHeader(res);

	//ConnectToDB(res);
	MongoClient.connect(URI, function (err, DBConnection) {
		if (err) {
			console.log('Unable to connect to the mongoDB server. Error:', err);
			res.write('{"returncode" : "fail","message" : "GrocerySpending connect failed"}');
			res.end();
			return;
		} 

		if(!DBConnection || (DBConnection == undefined) || DBConnection == null) {
			console.log('DBConnection null');
			res.write('{"returncode" : "fail","message" : "GrocerySpending DBConnect null"}');
			res.end();
			return;
      }

		var collection = DBConnection.collection('NameValue');
		if(!collection || (collection == undefined)) {
			console.log("There was an error attaching to GrocerySpending:NameValue.");
			console.log("DBConnection.NameValue=:"+DBConnection.NameValue+":");
			res.write('{"returncode" : "fail","message" : "GrocerySpending.NameValue missing"}');
			res.end();
			return;
      }
		console.log("NameValue found, collection OK");
      var results = {};
	
		collection.find({}).toArray(function (err, records) {
			if(err) {
				console.log("There was an error executing the database query.");
				res.write('{"returncode" : "fail","message" : "NameValue Find Failed"}');
				res.end();
				return;
			}
			results['returncode']  =  'pass';
			console.log('records.length = :'+records.length+':')

         var tagsList = [];
			for(var i=0,il=records.length; i<il; ++i) {
            var item = {};
				if(records[i]['name'] == 'tag')
            tagsList.push(records[i]['value']);
			   results['StoreList'] = tagsList;
			}
			res.write(JSON.stringify(results,null,'\n'));
			res.end();
		});
  });
}); // GetTags

/*
var server = app.listen(8080, function () {
  var host = server.address().address;
  var port = server.address().port;
  console.log('GrocerySpending request application listening at http://%s:%s', host, port);
});
*/

http.createServer(app).listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
});


function writeJSONHeader(res)
{
	res.writeHead(200, {
        "Content-Type": "application/json\n\n"
    });
} // writeJSONHeader

function ConnectToDB(res)
{
	if(DBConnection == null) DBConnection  = mongojs.connect(URI);
	if(!DBConnection || (DBConnection == undefined)) {
		console.log("ConnectToDB: There was an error executing the database connection.");
		res.write('{"returncode" : "fail","message" : "GrocerySpending connect Failed"}');
		res.end();
		return;
	}
	console.log("DB Connection OK");
} // ConnectToDB
