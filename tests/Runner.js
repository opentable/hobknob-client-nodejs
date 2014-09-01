var Etcd = require("node-etcd"),
    etcd = new Etcd(),
    Client = require("../src/Client"),
    toggles = [
        {appName: "app1", name: "toggle1", cacheIntervalMs: 1000},
        {appName: "app2", name: "toggle2", cacheIntervalMs: 2000},
        {appName: "app3", name: "toggle3", cacheIntervalMs: 3000}
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
    client.on("updated-cache", function(value){
        console.log("Updated cache: " + JSON.stringify(value));
    });
    client.initialise(function(err){
        clientInitializedCount++;
        if (clientInitializedCount == toggles.length){
            run();
        }
    });
    clients.push(client);
}

var run = function(){
    setInterval(function(){
        var i = parseInt(Math.random() * 10) % toggles.length;
        var appName = toggles[i].appName;
        var name = toggles[i].name;
        var value = clients[i].get(name);
        console.log(appName + "/" + name + ": " + value);
    }, parseInt(Math.random() * 3000));
};
