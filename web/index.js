var express  = require("express")
	,mongodb = require("mongodb")
   ,http = require('http')
   ,path = require('path')
	,fs = require("fs");

var NVCollection = 'NameValue';
var ItemsCollection = 'Items';

var MongoClient = mongodb.MongoClient;
	
var app = express();
var URI = "mongodb://localhost:27017/GrocerySpending";

app.set('port', process.env.PORT || 3000);
app.use(express.static(path.join(__dirname, 'static')));

app.get('/', function(req, res){
  res.render('index', {
    title: 'Home'
  });
});

app.get('/about', function (req, res)
{
  res.send('Grocery Spending Recorder');
});

app.get('/GetValues/:requestedName', function (req, res)
{
	var requestedName=req.params.requestedName;
	console.log('Starting GetValues requestedName='+requestedName);
	writeJSONHeader(res);
   var dbConnection = null;

	MongoClient.connect(URI, function (err, dbConnection) {
		if (err) {
			console.log('Unable to connect to the mongoDB server. Error:', err);
			res.write('{"returncode" : "fail","message" : "GrocerySpending MongoClient connect failed"}');
			res.end();
			return;
		} 

      if(!CheckDBConnection(dbConnection,res)) return;

      var collection = GetCheckCollection(NVCollection,dbConnection,res);
      if(collection == null) return;
		console.log(NVCollection+" found, collection OK");

      var results = {};
	
		collection.find({}).toArray(function (err, records) {
			if(err) {
				console.log("There was an error executing the database query.");
				res.write('{"returncode" : "fail","message" : '+NVCollection+'"Find Failed"}');
				res.end();
				return;
			}
			console.log('records.length = :'+records.length+':')

         var valueList = [];
			for(var i=0,il=records.length; i<il; ++i) {
				if(records[i]['name'] == requestedName)
               valueList.push(records[i]['value']);
			}
			results['returncode']  =  'pass';
			results['values'] = valueList;
			res.write(JSON.stringify(results,null,'\n'));
			res.end();
		}); // find
  });
}); // GetValues

app.get('/GetItems', function (req, res)
{
	console.log('Starting GetItems');
	writeJSONHeader(res);
   var dbConnection = null;

	MongoClient.connect(URI, function (err, dbConnection) {
		if (err) {
			console.log('Unable to connect to the mongoDB server. Error:', err);
			res.write('{"returncode" : "fail","message" : "GrocerySpending MongoClient connect failed"}');
			res.end();
			return;
		} 

      if(!CheckDBConnection(dbConnection,res)) return;

      var collection = GetCheckCollection(ItemsCollection,dbConnection,res);
      if(collection == null) return;
		console.log(NVCollection+" found, collection OK");

      var results = {};
	
		collection.find({}).toArray(function (err, records) {
			if(err) {
				console.log("There was an error executing the database query.");
				res.write('{"returncode" : "fail","message" : '+ItemsCollection+'"Find Failed"}');
				res.end();
				return;
			}
			console.log('records.length = :'+records.length+':')

         var valueList = [];
			for(var i=0,il=records.length; i<il; ++i) {
            valueList.push(records[i]);
			}
			results['returncode']  =  'pass';
			results['values'] = valueList;
			res.write(JSON.stringify(results,null,'\n'));
			res.end();
		}); // find
  });
}); // GetItems

http.createServer(app).listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
});


function writeJSONHeader(res)
{
	res.writeHead(200, {
        "Content-Type": "application/json\n\n"
    });
} // writeJSONHeader

function CheckDBConnection(dbConnection,res)
{
	if(!dbConnection || (dbConnection == undefined) || dbConnection == null) {
		console.log("CheckDBConnection: There was an error executing the database connection.");
		res.write('{"returncode" : "fail","message" : "GrocerySpending connect Failed","db" :'+ dbConnection+'}');
		res.end();
		return false;
	}
	console.log("DB Connection OK");
	return true;
} // CheckDBConnection

function GetCheckCollection(collectionName,dbConnection,res)
{
		var collection = dbConnection.collection(collectionName);
		if(!collection || (collection == undefined)) {
			console.log("There was an error attaching to GrocerySpending:"+collectionName);
			res.write('{"returncode" : "fail","message" : "GrocerySpending.'+collectionName+' missing"}');
			res.end();
			return null;
      }
      return(collection);
} // GetCheckCollection
