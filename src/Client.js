var util = require("util"),
    Cache = require("./Cache"),
    events = require("events");

function Client(applicationName, config) {
    this.eventEmitter = new events.EventEmitter();
    this.cache = new Cache(applicationName, config, this.eventEmitter);
}

var _getOrDefault = function(cache, toggleName, secondaryKey, defaultValue){
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

Client.prototype.getOrDefault = function(){
    var args = arguments,
        toggleName = args[0],
        secondaryKey = null,
        defaultValue;

    if (args.length === 2){
        defaultValue = args[1];
    } else {
        secondaryKey = args[1];
        defaultValue = args[2];
    }

    return _getOrDefault(this.cache, toggleName, secondaryKey, defaultValue);
};

Client.prototype.getAll = function() {
    return this.cache.getAll();
};

Client.prototype.dispose = function(){
    this.cache.dispose();
};

Client.prototype.on = function(eventName, handler){
    this.eventEmitter.on(eventName, handler);
};

module.exports = Client;
