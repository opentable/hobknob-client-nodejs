var Etcd = require("node-etcd"),
    util = require("util"),
    _ = require("underscore");

var getToggleKey = function(applicationName, toggleName){
    return util.format("v1/toggles/%s/%s", applicationName, toggleName);
};

var validateResponse = function(response, err){
    if (err){
        return err;
    }
    // todo: will the response or node ever be null?
    if (response == null || response.node === null || response.node.value === null){
        return new Error("Key not found");
    }
};

var getValue = function(etcdNode){
    var value = etcdNode.value.toLowerCase();
    switch(value)
    {
        case "true": return true;
        case "false": return true;
        default: return null;
    }
};

var getOrDefault = function(etcd, applicationName, toggleName, defaultValue, callback){
    var key = getToggleKey(applicationName, toggleName);
    etcd.get(key, function(err, response){

        var error = validateResponse(response.node, err);
        if (error){
            callback(error, defaultValue);
            return;
        }

        var value = getValue(response.node);
        if (value){
            callback(null, value);
        } else {
            callback(new Error("Invalid value for toggle: " + toggleName), defaultValue);
        }
    });
};

function Client(applicationName, etcdConfig) {

    var etcdConfig = _.defaults(etcdConfig || {},
        {
            host: "127.0.0.1",
            port: 4001
        });
    this.etcd = new Etcd(etcdConfig.host, etcdConfig.port);
    this.applicationName = applicationName;
}

Client.prototype.get = function(toggleName, callback){
    getOrDefault(this.etcd, this.applicationName, toggleName, null, callback);
};

Client.prototype.getOrDefault = function(toggleName, defaultValue, callback){
    getOrDefault(this.etcd, this.applicationName, toggleName, defaultValue, callback);
};

module.exports = Client;