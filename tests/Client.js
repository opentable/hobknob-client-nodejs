var assert = require("assert"),
    Client = require("../src/Client.js"),
    Etcd = require("node-etcd"),
    etcd = new Etcd();

describe("client", function(){


    beforeEach(function(done){
        etcd.set('v1/toggles/testApp/onToggle', 'true');
        etcd.set('v1/toggles/testApp/offToggle', 'false');
        etcd.set('v1/toggles/testApp/noBoolToggle', 'noABool', function(){
            done();
        });
    });

    afterEach(function(done){
        etcd.del("v1/toggles/testApp/", { recursive: true }, done);
    });

    describe("simple get", function(){
        var client;

        beforeEach(function(done){
            client = new Client("testApp");
            client.on("error", function(err){
                assert.fail(err);
            });
            client.on("initialized", function(){
                done();
            });
        });

        afterEach(function(){
            client.dispose();
            client = null;
        });

        it("should get a true value for an existing key", function(done){
            client.get('onToggle', function(err, value){
                assert.equal(value, true);
                assert.equal(err, null,"err should be null");
                done();
            });
        });

        it("should get a false value for an existing key", function(done){
            client.get('offToggle', function(err, value){
                assert.equal(value, false);
                assert.equal(err, null,"err should be null");
                done();
            });
        });

        it("should return null for a non-existing key", function(done){
            client.get('noToggle', function(err, value){
                assert.equal(value, null);
                assert.equal(err, null,"err should be null");
                done();
            });
        });

        it("should return null for a non-bool value", function(done){
            client.get('noBoolToggle', function(err, value){
                assert.equal(value, null);
                assert.equal(err, null,"err should be null");
                done();
            });
        });
    });

    describe("simple get or default", function(){
        var client;

        beforeEach(function(done){
            client = new Client("testApp");
            client.on("error", function(err){
                assert.fail(err);
            });
            client.on("initialized", function(){
                done();
            });
        });

        afterEach(function(){
            client.dispose();
            client = null;
        });

        it("should get a true value for an existing key", function(done){
            client.getOrDefault('onToggle', false, function(err, value){
                assert.equal(value, true);
                assert.equal(err, null,"err should be null");
                done();
            });
        });

        it("should get a false value for an existing key", function(done){
            client.getOrDefault('offToggle', true, function(err, value){
                assert.equal(value, false);
                assert.equal(err, null,"err should be null");
                done();
            });
        });

        it("should return a default for a non-existing key", function(done){
            client.getOrDefault('noToggle', true, function(err, value){
                assert.equal(value, true);
                assert.equal(err, null,"err should be null");
                done();
            });
        });

        it("should return a default for a non-bool value", function(done){
            client.getOrDefault('noBoolToggle', true, function(err, value){
                assert.equal(value, true);
                assert.equal(err, null,"err should be null");
                done();
            });
        });
    });

    describe("application does not have any feature toggles set", function() {
        var client;

        beforeEach(function(done){
            client = new Client("anotherApp");
            client.on("error", function(err){
                assert.fail(err);
            });
            client.on("initialized", function(){
                done();
            });
        });

        afterEach(function(){
            client.dispose();
            client = null;
        });

        it("should no fail when updating the cache", function(done){
            client.get('toggle', function(err, value){
                assert.equal(err, null, "err should be null");
                assert.equal(value, null, "value should be null");
                done();
            });
        });
    });

    describe("etcd instance is down", function() {
        var client, caughtError;

        beforeEach(function(){
            client = new Client("testApp", { etcdPort: 123456 });
            client.on("error", function(){
                caughtError = true;
            });
        });

        afterEach(function(){
            client.dispose();
            client = null;
        });

        it("should emit an error when initializing", function(){
            setTimeout(function() {
                assert.equal(caughtError, true);
            }, 200);
        });

        it("should return an error when getting a toggle", function(done){
            client.get('toggle', function(err, value){
                assert.notEqual(err, null, "err should be not null");
                assert.equal(value, null, "value should be null");
                done();
            });
        });
    });


    describe("many gets", function(){
        var client, cacheUpdatingCount, cacheUpdateCount;

        beforeEach(function(done){
            client = new Client("testApp", {cacheInterval: 10000000});
            client.on("updating-cache", function(){
                cacheUpdatingCount++;
            });
            client.on("updating-cache", function(){
                cacheUpdateCount++;
            });
            client.on("initialized", function(){
                done();
            });
            cacheUpdatingCount = 0;
            cacheUpdateCount = 0;
        });

        afterEach(function(){
            client.dispose();
            client = null;
        });

        it("cache is only updated on first get", function(done){
            var updates = 0;
            for(var i = 0; i < 100; i++){
                client.get('onToggle', function(err, value){
                    updates++;
                });
            }
            setTimeout(function(){
                assert(updates > 1, "Should have retrieved the toggle value more than once");
                assert.equal(cacheUpdateCount, 0, "Cache should have been updated once on initialise");
                assert.equal(cacheUpdatingCount, 0, "Cache should not have been updated after being initialised");
                done();
            }, 200);
        });

        it("should perform well once data is cached", function(done){
            var updates = 0, startTime = 0, endTime = 0, runs = 1000000;
            for(var i = 0; i < runs; i++){
                client.get('onToggle', function(err, value){
                    if (updates === 0){
                        startTime = new Date().getTime();
                    }
                    updates++;
                    if (updates == runs){
                        endTime = new Date().getTime();
                        var timeTaken = endTime - startTime;
                        console.log("Time taken: " + timeTaken + "ms")
                        assert(timeTaken < 200, "Required < 200ms, got " + timeTaken + "ms");
                        done();
                    }
                });
            }
        });
    });
});