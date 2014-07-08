var util = require("util"),
    Store = require("./Store");

var getToggleKey = function(applicationName, toggleName){
    return util.format("v1/toggles/%s/%s", applicationName, toggleName);
};

var getOrDefault = function(store, applicationName, toggleName, defaultValue, callback){
    var key = getToggleKey(applicationName, toggleName);
    store.get(key, function(err, value){
        if (err){
            callback(err, defaultValue);
        } else {
            callback(null, value);
        }
    });
};

function Client(applicationName, etcdConfig) {
    this.store = new Store(etcdConfig);
    this.applicationName = applicationName;
}

Client.prototype.get = function(toggleName, callback){
    getOrDefault(this.store, this.applicationName, toggleName, null, callback);
};

Client.prototype.getOrDefault = function(toggleName, defaultValue, callback){
    getOrDefault(this.store, this.applicationName, toggleName, defaultValue, callback);
};

module.exports = Client;