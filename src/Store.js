var Etcd = require("node-etcd"),
    _ = require("underscore");


var validateResponse = function(response, err){
    if (err){
        return err;
    }
    // todo: will the response or node ever be null?
    if (!(response && response.node && response.node.value)){
        return new Error("Key not found");
    }
};

var getValue = function(etcdNode){
    var value = etcdNode.value.toLowerCase();
    switch(value)
    {
        case "true": return true;
        case "false": return false;
        default: return null;
    }
};

function Store(etcdConfig){
    var config = _.defaults(etcdConfig || {},
        {
            host: "127.0.0.1",
            port: 4001
        });
    this.etcd = new Etcd(config.host, config.port);
}

Store.prototype.get = function(key, callback){
    this.etcd.get(key, function(err, response){
        var error = validateResponse(response);
        if (error){
            callback(error, null);
        } else {
            callback(null, getValue(response.node));
        }
    });
};

module.exports = Store;