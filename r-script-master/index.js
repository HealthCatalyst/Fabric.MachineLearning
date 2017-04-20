var _ = require("underscore"),
    child_process = require("child_process");

function init(path) {
    var obj = new R(path);
    return _.bindAll(obj, "data", "call", "callSync");
}

function R(path) {
    this.d = {};
    this.path = path;
    this.options = {
        env: _.extend({ DIRNAME: __dirname }, process.env),
        encoding: "utf8"
    };
    this.idCounter = 0;
    this.args = ["--vanilla", __dirname + "/R/launch.R"];
}

R.prototype.data = function() {
    for (var i = 0; i < arguments.length; i++) {
        this.d[++this.idCounter] = arguments[i];
    }
    return this;
};

R.prototype.call = function(_opts, _callback) {
    var callback = _callback || _opts;
    var opts = _.isFunction(_opts) ? {} : _opts;
    this.options.env.input = JSON.stringify([this.d, this.path, opts]);
    console.log("spawn", this.args, this.options);
    var child = child_process.spawn("Rscript", this.args, this.options);
    var body = { out: "", err: "", timeout: false };
    if (_opts.timeout) {
        setTimeout(function() {
            child.stdin.pause(); // Required to make sure KILL works
            child.kill();
            body.timeout = true;
        }, _opts.timeout);
    }
    child.stderr.on("data", function(d) {
        // NOTE: Warning or Info messages get caught in stderr!
        //if (d.indexOf('Error ') != -1) {
        body.err += d;
        //}
    });
    child.stdout.on("data", function(d) {
        console.log("===Received data from stdout");
        console.log(d);
        console.log("==End of received data");
        body.out += d;
    });
    child.stderr.on("end", function() {});
    child.stdout.on("end", function() {
        if (body.timeout) callback(new Error('Too long run... terminated'));
        try {
            console.log("stdout has ended");
            console.log("==data at end");
            console.log(body.out);
            console.log("==end data at end");
            console.log("Error", body.err);
            if (body.err.length > 1) {
                callback(body.err, JSON.parse(body.out));
            } else {
                callback(null, JSON.parse(body.out));
            }
        } catch (error) {
            callback(error);
        }

    });
};

R.prototype.callSync = function(_opts) {
    var opts = _opts || {};
    this.options.env.input = JSON.stringify([this.d, this.path, opts]);
    var child = child_process.spawnSync("Rscript", this.args, this.options);
    if (child.stderr) throw child.stderr;
    return (JSON.parse(child.stdout));
};

module.exports = init;