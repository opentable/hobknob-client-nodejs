var util = require("util"),
    Cache = require("./Cache"),
    events = require("events");

function Client(applicationName, config) {
    this.eventEmitter = new events.EventEmitter();
    this.cache = new Cache(applicationName, config, this.eventEmitter);
}

var getOrDefault = function(cache, toggleName, defaultValue){
    var value = cache.get(toggleName);

    if (value === null){
        value = defaultValue;
    }

    return value;
};

Client.prototype.initialise = function(callback){
    var self = this;
    self.cache.initialise(callback);
};

Client.prototype.getOrDefault = function(toggleName, defaultValue){
    return getOrDefault(this.cache, toggleName, defaultValue);
};

Client.prototype.dispose = function(){
    this.cache.dispose();
};

Client.prototype.on = function(eventName, handler){
    this.eventEmitter.on(eventName, handler);
};

module.exports = Client;
