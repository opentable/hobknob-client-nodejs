var Etcd = require("node-etcd"),
    util = require("util"),
    _ = require("underscore");

function Client(applicationName, environment, etcdConfig) {

    etcdConfig = _.defaults(etcdConfig || {},
        {
            host: "127.0.0.1",
            port: 4001
        });
    this.etcd = new Etcd(etcdConfig.host, etcdConfig.port);
    this.applicationName = applicationName;
    this.environment = environment;
}

var getKey = function(applicationName, environment, toggleName){
    return util.format("v1/toggles/%s/%s/%s", applicationName, environment, toggleName);
};

Client.prototype.get = function(toggleName, callback){
    var key = getKey(this.applicationName, this.environment, toggleName);
    this.etcd.get(key, function(err, value, headers){

        // todo: clean this up and refactor, too ugly!
        if (err){
            callback(err, null);
        } else if (value.node.value === null){
            callback(null, null); // pass exception
        } else if (value.node.value.toLowerCase() === "true"){
            callback(null, true);
        } else if (value.node.value.toLowerCase() === "false"){
            callback(null, false);
        } else {
            callback(null, null); // pass exception
        }

    });
};

Client.prototype.getOrDefault = function(toggleName, defaultValue, callback){
    var key = getKey(this.applicationName, this.environment, toggleName);
    this.etcd.get(key, function(err, value, headers){

        // todo: clean this up and refactor, too ugly!
        if (err){
            callback(err, defaultValue);
        } else if (value.node.value === null){
            callback(null, null); // pass exception
        } else if (value.node.value.toLowerCase() === "true"){
            callback(null, true);
        } else if (value.node.value.toLowerCase() === "false"){
            callback(null, false);
        } else {
            callback(null, defaultValue); // pass exception
        }
    });
};

module.exports = Client;