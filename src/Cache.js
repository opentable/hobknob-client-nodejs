var Etcd = require("node-etcd"),
    _ = require("underscore");

function Cache(applicationName, config, eventEmitter){
    this.applicationName = applicationName;
    this.eventEmitter = eventEmitter;

    config = _.defaults(config || {},
        {
            etcdHost: "127.0.0.1",
            etcdPort: 4001,
            cacheIntervalMs: 60000
        });

    if (config.cacheIntervalMs < 1000){
        throw new Error("Cache interval is too small, but be at least 1,000ms.");
    }

    this.etcd = new Etcd(config.etcdHost, config.etcdPort);
    this.intervalObject = setInterval(_.bind(this._updateCache, this), config.cacheIntervalMs);
    this._updateCache();
}

var getValueOrNullIfUndefined = function(cache, toggle){
    var value = cache[toggle];
    return value === undefined ? null : value;
};

var validateResponse = function(response, responseError){
    if (responseError){
        var error = new Error("Error updating cache, see inner error");
        error.inner = responseError;
        return error;
    }
    if (!(response && response.node)){
        return new Error("Error updating cache, response invalid");
    }
};

var parseValue = function(value){
    switch(value.toLowerCase())
    {
        case "true": return true;
        case "false": return false;
        default: return null;
    }
};

var parseResponse = function(response){
    return _.chain(response.node.nodes || [])
        .where(function (item) {
            return item.value !== undefined;
        })
        .map(function (item) {
            var key = _.last(item.key.split("/"));
            var value = parseValue(item.value);
            return [key, value];
        })
        .object()
        .value();
};

var setCache = function(self, value){
    var wasCacheNotInitialized = self.cache === undefined;
    self.cache = value;
    self.eventEmitter.emit("updated-cache", self);
    if (wasCacheNotInitialized){
        self.eventEmitter.emit("initialized");
    }
};

Cache.prototype.get = function(toggle, callback){
    var  self = this;
    if (self.cache){
        callback(null, getValueOrNullIfUndefined(self.cache, toggle));
    }
    else {
        var error = new Error("Cache not initialized");
        callback(error, null);
    }
};

Cache.prototype._updateCache = function(){
    var self = this;
    self.eventEmitter.emit("updating-cache", this);
    self.etcd.get("v1/toggles/" + this.applicationName, { recursive: true }, function(responseError, response){

        var noKeysFoundForApplication = responseError && responseError.errorCode === 100;
        if (noKeysFoundForApplication){
            setCache(self, {});
            return;
        }

        var validationError = validateResponse(response, responseError);
        if (validationError){
            self.eventEmitter.emit("error", validationError);
            return;
        }

        try {
            setCache(self, parseResponse(response));
        }
        catch(err){
            var error = new Error("Error updating cache");
            error.inner = err;
            self.eventEmitter.emit("error", error);
        }
    });
};

Cache.prototype.dispose = function(){
    clearInterval(this.intervalObject);
};

module.exports = Cache;