var Etcd = require("node-etcd"),
    _ = require("underscore");

function Cache(applicationName, config, eventEmitter){
    this.applicationName = applicationName;
    this.eventEmitter = eventEmitter;

    this.config = _.defaults(config || {},
        {
            etcdHost: "127.0.0.1",
            etcdPort: 4001,
            cacheIntervalMs: 60000
        });

    if (this.config.cacheIntervalMs < 1000){
        throw new Error("Cache interval is too small, must be at least 1,000ms.");
    }

    this.etcd = new Etcd(this.config.etcdHost, this.config.etcdPort);
}

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

var getSecondaryKeyValuePairs = function(featureNode, featureName){
    var metaDataKey = featureNode.key + "/@meta";
    return _.chain(featureNode.nodes)
        .filter(function(n) { return n.key !== metaDataKey; })
        .map(function(n){
            var featureAndSecondaryKey = featureName + "/" + _.last(n.key.split("/"));
            return [featureAndSecondaryKey, parseValue(n.value)];
        })
        .value();
};

var parseResponse = function(response){
    return _.chain(response.node.nodes || [])
        .map(function (item) {
            var featureName = _.last(item.key.split("/"));
            if (item.dir){
                return getSecondaryKeyValuePairs(item, featureName);
            } else {
                if (item.value === undefined) {
                    return [];
                }
                return [[featureName, parseValue(item.value)]];
            }
        })
        .flatten(true)
        .object()
        .value();
};

var diffs = function(previous, next){
    var result = [];
    var union = _.defaults(previous, next);
    Object.keys(union).forEach(function(k){
      if(union[k] !== next[k]){
        result.push({ name: k, old: union[k], new: next[k]});
      }
    });
    return result;
};

var setCache = function(self, value){
    self.eventEmitter.emit("updated-cache", diffs(self.cache || {}, value));
    self.cache = value;
};

Cache.prototype.get = function(toggle, secondaryKey){
    var self = this;
    if (!self.cache){
        self.eventEmitter.emit("error", new Error("Cache not initialized. Tried to read toggle: " + toggle));
        return null;
    }

    var key = secondaryKey ? toggle + "/" + secondaryKey : toggle;
    var value = self.cache[key];
    return value === undefined ? null : value;
};

Cache.prototype.initialise = function(callback){
  this.intervalObject = setInterval(_.bind(this._updateCache, this), this.config.cacheIntervalMs);
  this._updateCache(callback);
};

Cache.prototype._updateCache = function(complete){
    var self = this;
    if(!complete){
      complete = function(err){
        if(err){
          self.eventEmitter.emit("error", err);
        }
      };
    }

    self.etcd.get("v1/toggles/" + this.applicationName, { recursive: true }, function(responseError, response){

        var noKeysFoundForApplication = responseError && responseError.errorCode === 100;
        if (noKeysFoundForApplication){
            setCache(self, {});
            return complete();
        }

        var validationError = validateResponse(response, responseError);
        if (validationError){
            return complete(validationError);
        }

        try {
          setCache(self, parseResponse(response));
        }
        catch(err){
          complete(err);
        }

        complete();
    });
};

Cache.prototype.dispose = function(){
    clearInterval(this.intervalObject);
};

module.exports = Cache;
