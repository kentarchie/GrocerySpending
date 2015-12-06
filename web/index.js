var express  = require("express")
	,mongodb = require("mongodb")
   ,monk = require('monk')
   ,bodyParser = require('body-parser')
   ,http = require('http')
   ,path = require('path')
	,fs = require("fs");

var NV_COLLECTION = 'NameValue';
var ITEMS_COLLECTION = 'Items';
var DB_ID    = '_id';
var DB_DATE  = 'date';
var DB_STORE = 'store';
var DB_ITEM  = 'item';
var DB_PRICE = 'price';
var DB_TAGS  = 'tags';

var APPLICATION_NAME = 'GrocerySpending';

var MongoClient = mongodb.MongoClient;
var DB = monk('localhost:27017/'+APPLICATION_NAME);
	
var app = express();
var URI = "mongodb://localhost:27017/" + APPLICATION_NAME;

app.set('port', process.env.PORT || 3000);
app.use(express.static(path.join(__dirname, 'static')));
app.use( bodyParser.json() );       // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
  extended: true
})); 
app.use(function(req,res,next){
    req.db = DB;
    next();
});

http.createServer(app).listen(app.get('port'), function(){
  nodeLogger("Express server listening on port " + app.get('port'));
});

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
	nodeLogger('Starting GetValues requestedName='+requestedName);
	writeJSONHeader(res);
   var results = {};
	results['values'] = [];
	results['returncode']  =  'pass';
   var db = req.db;
   var collection = db.get(NV_COLLECTION);
   
   if((collection == null) || (collection == undefined)){
	   results['returncode']  =  'fail';
	   res.write(JSON.stringify(results,null,'\n'));
	   res.end();
      return;
   }

	nodeLogger(NV_COLLECTION + " found, collection OK");

   collection.find({},{},function(err,docs) {
		if(err) {
			nodeLogger("There was an error executing the database query.");
			res.write('{"returncode" : "fail","message" : '+NV_COLLECTION+'"Find Failed"}');
	      results['returncode']  =  'fail';
	      results['message']  =  NV_COLLECTION+' Find Failed';
	      res.write(JSON.stringify(results,null,'\n'));
			res.end();
			return;
		}
      for (var d in docs) {
		   if(docs[d]['name'] == requestedName) {
            results['values'].push(docs[d]['value']);
         }
      }
	   res.write(JSON.stringify(results,null,'\n'));
	   res.end();
   });
}); // GetValues

app.get('/GetItems', function (req, res)
{
	nodeLogger('Starting GetItems');
	writeJSONHeader(res);
   var results = {};
	results['values'] = [];
	results['returncode']  =  'pass';
   var db = req.db;
   var collection = db.get(ITEMS_COLLECTION);
   
   if((collection == null) || (collection == undefined)){
	   results['returncode']  =  'fail';
	   res.write(JSON.stringify(results,null,'\n'));
	   res.end();
      return;
   }

	nodeLogger(ITEMS_COLLECTION + " found, collection OK");

   collection.find({},{},function(err,docs) {
		if(err) {
			nodeLogger("There was an error executing the database query.");
			res.write('{"returncode" : "fail","message" : '+ITEMS_COLLECTION+'"Find Failed"}');
	      results['returncode']  =  'fail';
	      results['message']  =  ITEMS_COLLECTION+' Find Failed';
	      res.write(JSON.stringify(results,null,'\n'));
			res.end();
			return;
		}
      for (var d in docs) {
          results['values'].push(docs[d]);
      }
	   res.write(JSON.stringify(results,null,'\n'));
	   res.end();
   });
}); // GetItems

app.post('/SaveChanges', function(request, response)
{
    nodeLogger('SaveChanges: start');
	 writeJSONHeader(response);
    var results = {};
	 results['returncode']  =  'pass';
    var db = request.db;
    var collection = db.get(ITEMS_COLLECTION);
   
   if((collection == null) || (collection == undefined)){
	   results['returncode']  =  'fail';
	   res.write(JSON.stringify(results,null,'\n'));
	   res.end();
      return;
   }

	nodeLogger(ITEMS_COLLECTION + " found, collection OK");

   var requestBody = request.body;
   nodeLogger('changedRecords length = ' + requestBody.changedRecords.length);
	results['recordsChanged'] = requestBody.changedRecords.length;
	for(var i=0,il=requestBody.changedRecords.length; i<il; ++i) 
   {
	   nodeLogger('Updating record '+ i);
      var rec = requestBody.changedRecords[i];
	   nodeLogger('tags=:'+ rec[DB_TAGS]+':');
      try {
          var updateResults = collection.update(
               { _id : rec[DB_ID] }
               ,{ $set:{ 'tags'  : rec[DB_TAGS] } }
               ,{}
               ,function(err, r) {
                  if(err) {
                     nodeLogger("Items not updated");
	                  nodeLogger('Update Error ---START---');
	                  nodeLogger(err);
	                  nodeLogger('Update Error ---END---');
	                  nodeLogger('r=:'+r+':');
                  }
                  else {
	                  nodeLogger('collection update done:  record '+ i);
                  }
               }
          );
	      nodeLogger('updated record '+ i);
	       //nodeLogger("updateResults=" + JSON.stringify(updateResults,null,'\n'));
      }
      catch(e) {
	      nodeLogger('exception '+ e);
      }
	} // records loop
	 response.write(JSON.stringify(results,null,'\n'));
	 response.end();
}); //SaveChanges
           
function nodeLogger(str)
{
    console.log('NL: ' + str);
} // nodeLogger

function writeJSONHeader(res)
{
	res.writeHead(200, {
        "Content-Type": "application/json\n\n"
    });
} // writeJSONHeader

function CheckDBConnection(dbConnection,res)
{
	if(!dbConnection || (dbConnection == undefined) || dbConnection == null) {
		nodeLogger("CheckDBConnection: There was an error executing the database connection.");
		res.write('{"returncode" : "fail","message" : "'+APPLICATION_NAME+' connect Failed","db" :"'+ dbConnection+'"}');
		res.end();
		return false;
	}
	nodeLogger("CheckDBConnection: DB Connection OK");
	return true;
} // CheckDBConnection

function GetCheckCollection(collectionName,dbConnection,res)
{
		var collection = dbConnection.collection(collectionName);
		if(!collection || (collection == undefined)) {
			nodeLogger('There was an error attaching to '+APPLICATION_NAME+':'+collectionName);
			res.write('{"returncode" : "fail","message" : "'+APPLICATION_NAME+'".'+collectionName+' missing"}');
			res.end();
			return null;
      }
      nodeLogger('Collection (' + collectionName + ') OK');
      return(collection);
} // GetCheckCollection
