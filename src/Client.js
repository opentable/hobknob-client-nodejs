var util = require("util"),
    Cache = require("./Cache"),
    events = require("events");

function Client(applicationName, config) {
    this.eventEmitter = new events.EventEmitter();
    this.cache = new Cache(applicationName, config, this.eventEmitter);
}

var getOrDefault = function(cache, toggleName, secondaryKey, defaultValue){
    var value = cache.get(toggleName, secondaryKey);

    if (value === null){
        value = defaultValue;
    }

    return value;
};

Client.prototype.initialise = function(callback){
    var self = this;
    self.cache.initialise(callback);
};

Client.prototype.get = function(toggleName, secondaryKey){
    return getOrDefault(this.cache, toggleName, secondaryKey ? secondaryKey : null, null);
};

Client.prototype.getOrDefault = function(toggleName){
    var args = arguments,
        secondaryKey = null,
        defaultValue;

    if (args.length === 2){
        defaultValue = args[1];
    } else {
        secondaryKey = args[1];
        defaultValue = args[2];
    }

    return getOrDefault(this.cache, toggleName, secondaryKey, defaultValue);
};

Client.prototype.dispose = function(){
    this.cache.dispose();
};

Client.prototype.on = function(eventName, handler){
    this.eventEmitter.on(eventName, handler);
};

module.exports = Client;
