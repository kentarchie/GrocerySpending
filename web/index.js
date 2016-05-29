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
   var startMoment = makeDate(req.params.startDate);
   var endMoment = makeDate(req.params.endDate);

	var startDate = startMoment.startOf('day');
	var endDate = endMoment.endOf('day');

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

app.get('/GetStats', function (req, res)
{
	nodeLogger('Starting GetStats');
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
   var stats = {};
   stats['earliestDate'] = moment().now();
   stats['latestDate'] = moment().now();
   stats['totalByMonth'] = {};
   stats['totalByStore'] = {};
   stats['totalByItem'] = {};
   stats['totalByTag'] = {};

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
          var date = makeDate(d[DB_DATE]);
          var store = d[DB_STORE];
          var item = d[DB_ITEM];
          var price = d[DB_PRICE];
          var tags = d[DB_TAGS].split(',');
      }
	   res.write(JSON.stringify(results,null,'\n'));
	   res.end();
   });
}); // GetStats

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
   nodeLogger('AddItem: passed in date ' + newDate);
   var newStore = request.body.newStore;
   var newItem = request.body.newItem;
   var newPrice = request.body.newPrice;
   var newTags = request.body.newTags;
	results['date'] = moment(newDate).format(DATE_FORMAT);
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
	response.write(JSON.stringify(results,null,'\n'));
	response.end();
   return;

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
           
function makeDate(dateStr)
{
	nodeLogger('makeDate: dateStr='+dateStr);
   var dateParts = dateStr.split('-');
	return(moment(parseInt(dateParts[0])+"-"+parseInt(dateParts[1])+"-"+parseInt(dateParts[2]),"YYYY-MM-DD"));
} //makeDate

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
