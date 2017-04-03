/*jshint esversion: 6 */

var express = require('express'),
    app = express(),
    port = process.env.PORT || 8080;

var R = require("./r-script-master/index.js");

var bodyParser = require('body-parser');

var scriptsFolder = "/usr/share/fabricml/";

// create application/json parser
var textParser = bodyParser.text({ type: 'application/x-www-form-urlencoded' });

var jsonParser = bodyParser.json({ type: 'application/x-www-form-urlencoded' });

app.listen(port);

console.log('todo list RESTful API server started on: ' + port);

var bootstrap = function() {

    var attitude = JSON.parse(
        require("fs").readFileSync("src/r-script-master/example/attitude.json", "utf8"));

    console.log("Running bootstrap script");

    R(scriptsFolder + "ex-async.R")
        .data({ df: attitude, nGroups: 3, fxn: "mean" })
        .call(function(err, d) {
            if (err) {
                console.log("==ERROR==");
                console.log(err);
                //throw err;
            }

            console.log("==OUTPUT==");
            console.log(d);

            console.log("=== Bootstrap completed ===");
        });
}

app.get('/exit', function(req, res) {
    res.status(200).end();
    process.exit(0);
});

app.post('/jobs/:scriptName.:extension', jsonParser, function(req, res) {

    if (!req.body) return res.sendStatus(400);

    console.log(Object.prototype.toString.call(req.body));

    console.log(req.body);

    var attitude = req.body;

    var scriptPath = scriptsFolder + req.params.scriptName + "." + req.params.extension;

    var fs = require('fs');
    if (!fs.existsSync(scriptPath)) {
        res.status(500).end(scriptPath + " does not exist in the container");
        return;
    }

    console.log("Running", scriptPath);

    R(scriptPath)
        .data({ df: attitude, nGroups: 3, fxn: "mean" })
        .call(function(err, d) {
            if (err) {
                console.log("==ERROR==");
                console.log(err);
                //throw err;
                res.status(500).end();
            }

            console.log("==OUTPUT==");
            console.log(d);

            res.status(200).json(d);

        });
});

app.get('/test', function(req, res) {

    var out = R("src/r-script-master/example/simple.R")
        .call(function(err, d) {
            if (err) throw err;
            console.log("===Start Object");
            console.log(d);
            console.log("====End Object");

            res.status(200).end(d);
        });
});

bootstrap();