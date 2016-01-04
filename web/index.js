var express  = require("express")
	,mongodb = require("mongodb")
	,moment = require("moment")
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
var DATE_FORMAT = 'D MMM YYYY';

var APPLICATION_NAME = 'GrocerySpending';

var MongoClient = mongodb.MongoClient;
var DB = monk('localhost:27017/'+APPLICATION_NAME);
moment().format();
	
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

app.get('/GetItems/dates/:startDate/:endDate', function (req, res)
{
	nodeLogger('Starting GetItems/date start: startDate='+req.params.startDate+ ' endDate='+req.params.endDate);
   var startDateParts = req.params.startDate.split('-');
   var endDateParts = req.params.endDate.split('-');

   var startYear=parseInt(startDateParts[0]);
   var startMonth=parseInt(startDateParts[1]);
   var startDay=parseInt(startDateParts[2]);

   var endYear=parseInt(endDateParts[0]);
   var endMonth=parseInt(endDateParts[1]);
   var endDay=parseInt(endDateParts[2]);

	var startDate = moment(startYear+"-"+startMonth+"-"+startDay,"YYYY-MM-DD").startOf('day');
	var endDate = moment(endYear+"-"+endMonth+"-"+endDay,"YYYY-MM-DD").endOf('day');

	nodeLogger('Starting GetItems/date startDate='+startDate.format(DATE_FORMAT)+ ' endDate='+endDate.format(DATE_FORMAT));

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

   // {created_on: { $gte: start, $lt: end }}
   collection.find({
	      "date" : {
		      $gte: startDate.toDate()
		      ,$lt: endDate.toDate()
	      }
   },{},function(err,docs) {
		if(err) {
			nodeLogger("There was an error executing the database query.");
			res.write('{"returncode" : "fail","message" : '+ITEMS_COLLECTION+'" dates Find Failed"}');
	      results['returncode']  =  'fail';
	      results['message']  =  ITEMS_COLLECTION+'  dates Find Failed';
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
}); // GetItems/date

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

app.post('/AddNameValue', function(request, response)
{
    nodeLogger('AddTag: start');
	 writeJSONHeader(response);
    var results = {};
	 results['returncode']  =  'pass';
    var db = request.db;
    var collection = db.get(NV_COLLECTION);
   
   if((collection == null) || (collection == undefined)){
	   results['returncode']  =  'fail';
	   res.write(JSON.stringify(results,null,'\n'));
	   res.end();
      return;
   }
	nodeLogger(NV_COLLECTION + " found, collection OK");

   var newName = request.body.name;
   var newValue = request.body.value;
	results['name'] = newName;
	results['value'] = newValue;
	nodeLogger('AddTag: adding name  '+ newName + 'value=' + newValue);
   try {
      var addTag = collection.insert( {
         'name'  : newName
        ,'value' : newValue
      });
   }
   catch(e) {
	   nodeLogger('AddTag: exception '+ e);
	   results['returncode']  =  'fail';
   }
	response.write(JSON.stringify(results,null,'\n'));
	response.end();
}); //AddNameValue

app.post('/AddItem', function(request, response)
{
    nodeLogger('Item: start');
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

   var newDate = request.body.newDate;
   var newStore = request.body.newStore;
   var newItem = request.body.newItem;
   var newPrice = request.body.newPrice;
   var newTags = request.body.newTags;
	results['date'] = newDate;
	results['store'] = newStore;
	results['item'] = newItem;
	results['price'] = newPrice;
	results['tags'] = newTags;

   var newDocument = {
          'date'   : newDate
          ,'store' : newStore
          ,'item'  : newItem
          ,'price' : newPrice
          ,'tags'  : newTags
      };
   nodeLogger('AddItem: saving ' + JSON.stringify(newDocument,null,'\n'));
   try {
      var addItem = collection.insert(newDocument);
   }
   catch(e) {
	   nodeLogger('Item: exception '+ e);
	   results['returncode']  =  'fail';
   }
   nodeLogger('AddItem: done saving');
	response.write(JSON.stringify(results,null,'\n'));
	response.end();
}); //AddItem
           
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
