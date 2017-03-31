/*jshint esversion: 6 */

var express = require('express'),
    app = express(),
    port = process.env.PORT || 8080;

var R = require("./r-script-master/index.js");

app.listen(port);

console.log('todo list RESTful API server started on: ' + port);


app.get('/jobs', function(req, res) {

    //    console.log(spawn);

    // var out = R("example/ex-async.R")
    //     .data("hello world", 20)
    //     .call(function(err, d) {
    //         if (err) throw err;
    //         console.log("===Start Object");
    //         //console.log(d);
    //         console.log("====End Object");

    //         res.end(d);
    //     });

    var child_process = require('child_process');

    console.log(child_process);
    var child = child_process.spawn("Rscript", ["--vanilla", "/usr/local/R/simple.R"]);
    child.stdout.on('data', (data) => {
        console.log(`stdout: ${data}`);
    });

    child.stderr.on('data', (data) => {
        console.log(`stderr: ${data}`);
    });

    child.on('close', (code) => {
        console.log(`child process exited with code ${code}`);
    });

    // var out = R("example/simple.R")
    //     .call(function(err, d) {
    //         if (err) throw err;
    //         console.log("===Start Object");
    //         console.log(d);
    //         console.log("====End Object");

    //         res.end(d);
    //     });
});