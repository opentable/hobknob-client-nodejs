var Etcd = require("node-etcd"),
    etcd = new Etcd(),
    Client = require("../src/Client"),
    toggles = [
        {appName: "app1", name: "toggle1", cacheIntervalMs: 1000},
        {appName: "app2", name: "toggle2", cacheIntervalMs: 2000},
        {appName: "app3", name: "toggle3", cacheIntervalMs: 1000}
    ],
    clients = [],
    clientInitializedCount = 0,
    insertDummyData = true;

for(var i = 0; i < toggles.length; i++){
    var toggle = toggles[i];

    if (insertDummyData) {
        etcd.set("/v1/toggles/" + toggle.appName + "/" + toggle.name, (i % 2) == 0 ? true : false);
    }

    var client = new Client(toggle.appName, {cacheIntervalMs: toggle.cacheIntervalMs});
    client.on("error", function(err){
        console.log(err);
    });
    client.on("updated-cache", function(sender){
        console.log("Updated cache, app name: " + sender.applicationName);
    });
    client.on("initialized", function(){
        clientInitializedCount++;
        if (clientInitializedCount == toggles.length){
            run();
        }
    });
    clients.push(client);
}

var run = function(){
    setInterval(function(){
        for(var i = 0; i < toggles.length; i++) {
            var appName = toggles[i].appName;
            var name = toggles[i].name;
            clients[i].get(name, function(err, value){
                if (err){
                    console.log(appName + "/" + name + " - ERROR: " + err);
                } else {
                    console.log(appName + "/" + name + ": " + value);
                }
            });
        }
    }, 1000);
};