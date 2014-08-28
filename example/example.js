var HobknobClient = require("../src/Client"),
    client = new HobknobClient("testApp");

client.on("error", function(err){
  console.log(err);
});
client.on("updated-cache", function(){
  console.log("Cache updated");
});

client.on("initialized", function(){

  client.get("test1", function(err, value){
    console.log("test1")
    console.log(" - error: " + err);
    console.log(" - value: "+ value);
  });

  client.get("test2", function(err, value){
    console.log("test2")
    console.log(" - error: " + err);
    console.log(" - value: "+ value);
  });

  client.getOrDefault("test2", true, function(err, value){
    console.log("test2 - with default")
    console.log(" - error: " + err);
    console.log(" - value: "+ value);
  });

});
