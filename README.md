##Dependencies
###Software
Node.js
MongoDB
Monk
### Node Packages
npm install --save body-parser
### CSS
jquery-ui.min.css
jquery-ui-1.8.16.custom.css
jquery.datetimepicker.css
defaultTheme.css
easytabs.css
### JavaScript
jquery.js
jquery.leanModal.min.js
jquery.event.drag-2.2.js
jquery.easytabs.min.js
jquery-ui.min.js
jquery.datetimepicker.js
jquery.fixedheadertable.min.js
moment.min.js

##2 November, 2015
This was originally a web application built using Apache httpd, PHP and MySQL.
This project is to convert it to node.js and Mongo.
The first commit has the basic structure and the start of the Mongo interface.
The database directory contains two json files that have initial data for the tables.
The web application won't be published for general use.

After the web application is converted, I will build an Android app to do the same stuff.
The Android app will keep the data locally on the device.

## 20 November, 2015
The web application is displaying the existing data and has the JQuery ui elements working.
These are the scrolling table, the tags list and the autocomplete stores and items lists.
It also supports drag and drop between the tags list and the tags fields on the form and on the table
Working on the backend updating of the changed records.
## 6 December 2015
Rewrote the routes using monk for the Mongo interface. Finally got changed tags to be updated.
