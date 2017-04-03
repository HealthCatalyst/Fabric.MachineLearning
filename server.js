/*jshint esversion: 6 */

var express = require('express'),
    app = express(),
    port = process.env.PORT || 8080;

var R = require("./r-script-master/index.js");

app.listen(port);

console.log('todo list RESTful API server started on: ' + port);

app.get('/exit', function(req, res) {
    process.exit(0);
});

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

    // var child_process = require('child_process');

    // //console.log(child_process);
    // var child = child_process.spawn("Rscript", ["--vanilla", "/usr/local/R/simple.R"]);
    // child.stdout.on('data', (data) => {
    //     console.log(`stdout: ${data}`);
    // });

    // child.stderr.on('data', (data) => {
    //     console.log(`stderr: ${data}`);
    // });

    // child.on('close', (code) => {
    //     console.log(`child process exited with code ${code}`);
    //     res.end("OK");
    // });

    // var out = R("example/simple.R")
    //     .call(function(err, d) {
    //         if (err) throw err;
    //         console.log("===Start Object");
    //         console.log(d);
    //         console.log("====End Object");

    //         res.end(d);
    //     });

    var attitude = JSON.parse(
        require("fs").readFileSync("src/r-script-master/example/attitude.json", "utf8"));

    R("src/r-script-master/example/ex-async.R")
        .data({ df: attitude, nGroups: 3, fxn: "mean" })
        .call(function(err, d) {
            if (err) {
                console.log("==ERROR==");
                console.log(err);
                //throw err;
            }

            console.log("==OUTPUT==");
            console.log(d);

            res.end("OK");

        });

});

app.get('/test', function(req, res) {

    var out = R("src/r-script-master/example/simple.R")
        .call(function(err, d) {
            if (err) throw err;
            console.log("===Start Object");
            console.log(d);
            console.log("====End Object");

            res.end(d);
        });
});