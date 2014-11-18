var HobknobClient = require("../src/Client"),
    client = new HobknobClient("testApp");

client.on("error", function(err){
    console.log(err);
});
client.on("updated-cache", function(){
    console.log("Cache updated");
});

client.initialise(function(err){
    if (err){
        throw err;
    }

    var test1 = client.get("test1");
    console.log("test1 expected: true, actual: " + test1);

    var test2 = client.get("test2");
    console.log("test2 expected: null, actual: " + test2);

    var test3 = client.getOrDefault("test2", true);
    console.log("test3 expected: true, actual: " + test3);

    var multiTest1 = client.get("multi", "com");
    console.log("multiTest1 expected: true, actual: " + multiTest1);

    var multiTest2 = client.get("multi", "monkey");
    console.log("multiTest2 expected: null, actual: " + multiTest2);

    var multiTest3 = client.getOrDefault("multi", "monkey", true);
    console.log("multiTest3 expected: true, actual: " + multiTest3);
});
