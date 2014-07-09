var util = require("util"),
    Cache = require("./Cache"),
    events = require("events");

function Client(applicationName, config) {
    this.eventEmitter = new events.EventEmitter();
    this.cache = new Cache(applicationName, config, this.eventEmitter);
}

var getOrDefault = function(cache, toggleName, defaultValue, callback){
    cache.get(toggleName, function(err, value){
        if (err){
            callback(err, defaultValue);
        }
        else {
            if (value === null){
                value = defaultValue;
            }
            callback(null, value);
        }
    });
};

Client.prototype.get = function(toggleName, callback){
    getOrDefault(this.cache, toggleName, null, callback);
};

Client.prototype.getOrDefault = function(toggleName, defaultValue, callback){
    getOrDefault(this.cache, toggleName, defaultValue, callback);
};

Client.prototype.dispose = function(){
    this.cache.dispose();
};

Client.prototype.on = function(eventName, handler){
    this.eventEmitter.on(eventName, handler);
};

module.exports = Client;