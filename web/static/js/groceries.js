var Tags = [];
var Stores = [];
var ItemList = [];
var ItemData = [];
var ConfigData = null;
var DBParams = "";
var RecordsChanged = false;
var NumRecordsChanged = 0;

var ErrorDialog,MesgDialog;

$(document).ready(function() {
   logger('init: START ');

   $('#tab-container').easytabs();
   $('#newDate').val(moment().format('YYYY-MM-DD'));
    
   jQuery('#newDate').datetimepicker({
      format:'Y-m-d',
      timepicker:false
   });
   
   ErrorDialog = $('#dialog-dataerror').dialog({
      autoOpen: false
      ,height: 300
      ,width: 350
      ,modal: true
   });

   MesgDialog = $('#dialog-mesg').dialog({
      autoOpen: false
      ,height: 300
      ,width: 350
      ,modal: true
   });

   $('#addTag').click(addTag);
   $('#addItem').click(addItem);
   $('#testUpdate').click(testUpdate);
   var copyRightYear = new Date().getFullYear();
   logger('init:  copyRightYear=:'+copyRightYear+':');
   $('.copyright span').html(copyRightYear);
   getItems();
}); // init function 

function dataError(which)
{
    logger('dataErrors: STARTED: which=:'+which+':');
    ErrorDialog.dialog( "open" );
} // dataError

function getTags()
{
    logger('getTags: STARTED');
    $.ajax({
        type: "GET"
        ,dataType: "json"
        ,url: 'GetValues/tag'
        ,data: ''
        ,success: function(data)
        {
            logger('getTags: result received');
            if (data.returncode == 'pass') {
                logger('getTags: data.values.length=:'+data.values.length+':');
                $('#tagSource ul').html('');
                var tlist=[];
                for(var d=0,dl=data.values.length; d< dl; ++d ) {
                   tlist.push("<li>" + data.values[d] + "</li>");
                }
                $('#tagSource ul').html(tlist.join(' '));
                $(".tagSource li").draggable({
                   helper : 'clone'
                   ,containment : 'document'
                });
                logger('init: draggable done');
                logger('getTags: UL list created');
            }
            else {
               logger('getTags: result failed');
               dataError("Tags");
            }
        }
    });
} // getTags

function getStores()
{
    logger('getStores: started');
    $.ajax({
        type: "GET"
        ,dataType: "json"
        ,url: 'GetValues/store'
        ,data: ''
        ,success: function(data)
        {
            logger('getStores: result received');
            if (data.returncode == 'pass') {
                logger('getStores: data.values.length=:'+data.values.length+':');
                $('#newStore').autocomplete({
                     source: data.values
                });
            }
            else {
               logger('getStores: result failed');
               dataError("Stores");
            }
        }
    });
} // getStores

function getItems()
{
    logger('getItems: started');
    $.ajax({
        type: "GET"
        ,dataType: "json"
        ,url: 'GetItems'
        ,data: ''
        ,success: function(data)
        {
            logger('getItems: result received');
            if (data.returncode == 'pass') {
               ItemData = data.values;
               logger('getItems: returncode=:'+data.returncode+':');
               makeItemList(ItemData);
               makeTable(ItemData);
               getStores();
               getTags();
               $("#itemsTbody td:nth-child(5),.tagDrop").droppable({
                     drop: function (event, ui) {
                        //logger('dropHandler: delegateTarget=:'+$(this).html()+':');
                        var newTag = ui.draggable.text(); // what got dropped
                        var oldTags = $(this).text().replace('Tags','');
                        var row = $(this).attr('data-row');
                        var sep = (oldTags.length == 0) ? '' : ',';
                        var updatedTags = oldTags + sep + newTag;
                        //logger('dropHandler: newTag= :'+newTag+':');
                        //logger('dropHandler: oldTags=:'+oldTags+':');
                        $(this).html(updatedTags);
                        $(this).trigger('CellChange',[event,ui]);
                        if(row != undefined) {
                           RecordsChanged = true;
                           NumRecordsChanged++;
                           for(var r=0,rL=ItemData.length; r<rL; ++r) {
                              if(ItemData[r].rowid == row) {
                                 ItemData[r]['tags'] = updatedTags;
                                 ItemData[r].changed = true;
                                 $(this).css('background-color', 'yellow');
                                 break;
                              }
                           }
                           if(NumRecordsChanged > 3) {
                              logger('dropHandler: NumRecordsChanged = :'+NumRecordsChanged+':');
                              saveChanges();
                           }
                        }
                        logger('dropHandler: data-row= :'+row+':');
                     }
                  });
            }
            else {
               logger('getItems: result failed');
               dataError("Items");
            }
        }
    });
} // getItems

function makeItemList(data)
{
    var uniqueItems = {};
    logger('makeItemList: START');
    logger('makeItemList: data.length=:'+data.length+':');
    //logger('makeItemList: Object.prototype.toString.call( ItemList )=:'+ Object.prototype.toString.call( ItemList )+':');
    jQuery.each(data, function(d) {
        //logger('makeItemList: data[d]=:'+JSON.stringify(data[d],null,'\n')+':');
        var thisItem = data[d]['item'];
        //logger('makeItemList: thisItem=:'+ thisItem+':');
        uniqueItems[thisItem] = '';
    });

    jQuery.each(uniqueItems, function(k) {
        ItemList.push(k);
    });
    logger('makeItemList: ItemList.length=:'+ ItemList.length+': ItemList[10]=:'+ ItemList[10]+':');
    logger('makeItemList: typeof ItemList=:'+ typeof(ItemList)+': typeof(ItemList[10])=:'+ typeof(ItemList[10])+':');
    logger('makeItemList: after Object.prototype.toString.call( ItemList )=:'+ Object.prototype.toString.call( ItemList )+':');
    $('#newItem').autocomplete({
         source: ItemList
         ,width: 200
         ,max: 10
         ,highlight: false
         ,scroll: true
         ,scrollHeight: 300
    });
    logger('makeItemList: item list set up');
} // makeItemList

/*
data.values : [{
   "rowid" : "1"
   ,"changed" : false
   ,"date" : "2014-04-05"
   ,"store" : "Walmart"
   ,"item" : "Paper Towels"
   ,"price" : 3.64
   ,"tags" : ""
   }
]
*/

function makeTable(data)
{
    logger('makeTable: START');
    logger('makeTable: data.length=:'+data.length+':');
    var outList = [];
    for(var row=0,rowL=data.length; row<rowL; ++row) {
        var dValue = data[row];
        outList.push('<tr>');
        outList.push('<td>'+dValue['date']+'</td>');
        outList.push('<td>'+dValue['store']+'</td>');
        outList.push('<td>'+dValue['item']+'</td>');
        outList.push('<td>'+dValue['price']+'</td>');
        outList.push('<td data-row="'+dValue['rowid']+'">'+dValue['tags']+'</td>');
        outList.push('</tr>');
    }
    logger('makeTable: outList made');
    $('#itemsTBody').html(outList.join(''));
    logger('makeTable: before table make');
    $('#itemsTable').fixedHeaderTable({ 
         height : '270'
         ,width : '750'
         ,themeClass : 'defaultTheme'
    });
    logger('makeTable: after table make');
} // makeTable

function saveChanges()
{
    var data = {};
    data['DBHost'] = ConfigData['DBHost'];
    data['DBName'] = ConfigData['DBName'];
    data['DBUser'] = ConfigData['DBUser'];
    data['DBPass'] = ConfigData['DBPass'];

    var changedRecords = [];
    for(var r=0,rL=ItemData.length; r<rL; ++r) {
       if( ItemData[r].changed) {
           var record = ItemData[r]['rowid'];
           record += '^' + ItemData[r]['date'];
           record += '^' + ItemData[r]['store'];
           record += '^' + ItemData[r]['item'];
           record += '^' + ItemData[r]['price'];
           record += '^' + ItemData[r]['tags'];
           logger('saveChanges: saving record=:'+record+':');
           changedRecords.push(record);
       }
    }
    data['changedRecords'] = changedRecords;
    //logger('saveChanges: data before send=:'+JSON.stringify(data,null,'\n')+':');
    $.ajax({
        type: 'POST'
        ,url: 'backend/UpdateItems.cgi'
        ,data: JSON.stringify(data)
        ,success: function(data)
        {
            if (data.returncode == 'pass') {
               logger('saveChanges: changed records updated');
               RecordsChanged = false;
               NumRecordsChanged = 0;
            }
            else {
               logger('saveChanges: changed records update failed');
               dataError("Changed Items");
            }
        }
    });
} // saveChanges

function addItem(ev)
{
   logger('addItem: start');
   var formStr = $('#newItemEntry').serialize();
   var tagValue = $('#newTags').html();
   logger('addItem: adding item :' +formStr+ ':');
   $.ajax({
     type: "GET"
     ,dataType: "json"
     ,url: "backend/AddItem.cgi"
     ,data: DBParams+"&tags="+tagValue+"&"+formStr
     ,success: function(data,status,xhr)
     {
        //logger('init: data=:'+JSON.stringify(data,null,'\n')+':');
        if (data.returncode == 'pass') {
           $('#mesgData').html('adding item worked');
           MesgDialog.dialog( "open" );
           window.setTimeout(function(){
               MesgDialog.hide();
               logger('addItem: mesg closed');
           }, 3000);

        }
        else {
           $('#mesgData').html('adding item failed');
           MesgDialog.dialog( "open" );
        }
     }
   });
} // addItem

function addTag(ev)
{
   var tag = $('#newTag').val();
   logger('addTag: addTag tag=:'+tag+':');
   $.ajax({
     type: "GET"
     ,dataType: "json"
     ,url: "backend/AddTag.cgi"
     ,data: DBParams+"&tag="+tag
     ,success: function(data,status,xhr)
     {
         //logger('addTag: addTag xhr=:'+xhr+':');
         //logger('addTag: data=:'+JSON.stringify(data,null,'\n')+':');
         if (data.returncode == 'pass') {
            $('#mesgData').html('adding tag ' +tag+ ' worked');
            MesgDialog.dialog( "open" );

            $('#newTag').val('');
            getTags();
         }
         else {
            $('#mesgData').html('adding tag ' +tag+ ' failed');
            MesgDialog.dialog( "open" );
         }
     }
   });
} // addTag

function logger(str)
{
    if(window.console && console.log) console.log('GS: ' + str);
} // logger

function testUpdate()
{
    $.ajax({
        type: 'POST'
        ,url: 'backend/UpdateItems.cgi'
        ,data: '{"DBHost":"archie-p.ipowermysql.com","DBName":"archiep_groceries","DBUser":"food","DBPass":"901fghjkl","changedRecords":["1961;2014-04-05;Walmart;Bread;1.68;Bakery","1962;2014-04-05;Walmart;Bread;1.68;Baking","1963;2014-04-05;Walmart;Buns;2.32;Bakery"]}'
        ,success: function(data)
        {
            if (data.returncode == 'pass') {
               logger('testUpdate: changed records updated');
            }
            else {
               logger('testUpdate: changed records update failed');
            }
        }
    });
} // tstUpdate
