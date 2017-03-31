var express = require('express'),
    app = express(),
    port = process.env.PORT || 8080;

var R = require("r-script");

app.listen(port);

console.log('todo list RESTful API server started on: ' + port);


app.get('/jobs', function(req, res) {
    res.end("hello");
});