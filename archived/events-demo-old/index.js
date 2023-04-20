const express = require('express');
const path = require('path');
const bodyParser = require('body-parser')
const exphbs  = require('express-handlebars');
var jwt = require('jsonwebtoken');
const PORT = 3000;
var app = express();
app.disable('x-powered-by');
app.use( bodyParser.json() );       // to support JSON-encoded bodies
app.use( bodyParser.urlencoded({     // to support URL-encoded bodies
  extended: true
}));
app.engine('handlebars', exphbs({defaultLayout: 'main'}));
app.set('view engine', 'handlebars');
app.use('/', express.static( path.join(__dirname, 'public')))
app.all('*', function (req, res) {
  // res.send('Hello World!' + process.env.DATABASE_NAME + 'test')
  // res.sendFile( path.join(__dirname + '/index.html') );
  // res.send('hello');
  if(req.originalUrl == '/') {
    res.sendFile( path.join(__dirname + '/index.html') );
  } else if(req.originalUrl == '/wellmaster/') {
    res.sendFile( path.join(__dirname + '/wellmaster/index.html') );
  } else if(req.originalUrl == '/pipesim/') {
    res.sendFile( path.join(__dirname + '/pipesim/index.html') );
  } else if(req.originalUrl == '/power-bi/') {
    res.sendFile( path.join(__dirname + '/power-bi/index.html') );
  } else if(req.originalUrl == '/events/') {
    var decodedToken = jwt.decode(req.body.token, {complete: true});
    console.log('decodedToken', decodedToken);
    var stringifiedToken = JSON.stringify(decodedToken, null, 2);
    res.render('events', {
      layout: false,
      token: stringifiedToken,
    });
  } else {
    res.send('Not found');
  }
})
app.listen(PORT, function () {
  console.log(`listening on port ${PORT}!`);
})