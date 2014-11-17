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

    switch(args.length){
        case 2:
            defaultValue = args[1];
            break;
        case 3:
            secondaryKey = args[1];
            defaultValue = args[2];
            break;
        default:
            throw new Error("getOrDefault should provide 2 or 3 arguments: (toggleName, defaultValue) or (toggleName, secondaryKey, defaultValue)");
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
