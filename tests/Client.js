var assert = require("assert"),
    nock = require("nock"),
    http = require("http"),
    Client = require("../src/Client.js"),
    Etcd = require("node-etcd"),
    etcd = new Etcd(),
    useFakeEtcdResponses = process.env.TRAVIS === "true",
    testAppFeatureToggles;

if (useFakeEtcdResponses){
    console.log("Using fake Etcd responses");
}

describe("client", function(){

    beforeEach(function(done){

        if (useFakeEtcdResponses) {

            testAppFeatureToggles = {
                "action": "get",
                "node": {
                    "key": "/v1/toggles/testApp",
                    "dir": true,
                    "nodes": [
                        {
                            "key": "/v1/toggles/testApp/onToggle",
                            "value": "true",
                            "modifiedIndex": 4463,
                            "createdIndex": 4463
                        },
                        {
                            "key": "/v1/toggles/testApp/offToggle",
                            "value": "false",
                            "modifiedIndex": 4464,
                            "createdIndex": 4464
                        },
                        {
                            "key": "/v1/toggles/testApp/noBoolToggle",
                            "value": "notABool",
                            "modifiedIndex": 4465,
                            "createdIndex": 4465
                        }
                    ],
                    "modifiedIndex": 3,
                    "createdIndex": 3
                }};

            nock("http://127.0.0.1:4001")
                .get("/v2/keys/v1/toggles/testApp?recursive=true")
                .reply(200, testAppFeatureToggles);


            var anotherAppFeatureToggles = {
                "errorCode": 100,
                "message": "Key not found",
                "cause": "/v1/toggles/anotherApp",
                "index": 4465
            };

            nock("http://127.0.0.1:4001")
                .get("/v2/keys/v1/toggles/anotherApp?recursive=true")
                .reply(404, anotherAppFeatureToggles);

            done();

        } else {
            etcd.set('v1/toggles/testApp/onToggle', 'true');
            etcd.set('v1/toggles/testApp/offToggle', 'false');
            etcd.set('v1/toggles/testApp/noBoolToggle', 'noABool', function(){
                done();
            });
        }
    });


    afterEach(function(done){
        if (!useFakeEtcdResponses) {
            etcd.del("v1/toggles/testApp/", { recursive: true }, done);
        } else {
            done();
        }
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
            client = new Client("testApp");
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

        it("should get the same value for the same key if called twice", function(done){
            client.get('onToggle', function(err1, value1){
                client.get('onToggle', function(err2, value2){
                    assert.equal(value1, value2);
                    done();
                });
            });
        });

        it("should perform well once data is cached", function(done){
            var updates = 0, startTime = 0, endTime = 0, runs = 10000;
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

    describe("cache updating", function(){
        var client, cacheUpdateCount;

        beforeEach(function(done){
            client = new Client("testApp", {cacheIntervalMs: 1000});
            client.on("updating-cache", function(){
                cacheUpdateCount++;
            });
            client.on("initialized", function(){

                if (useFakeEtcdResponses) {
                    // need to re-intercept this call, as nock removes intercepts after being called once
                    nock("http://127.0.0.1:4001")
                        .get("/v2/keys/v1/toggles/testApp?recursive=true")
                        .reply(200, testAppFeatureToggles);
                }
                done();
            });
            cacheUpdateCount = 0;
        });

        afterEach(function(){
            client.dispose();
            client = null;
        });

        it("cache is not updated on a client get", function(done){
            var updates = 0;
            for(var i = 0; i < 10; i++){
                client.get('onToggle', function(err, value){
                    updates++;
                });
            }
            setTimeout(function(){
                assert(updates > 1, "Should have retrieved the toggle value more than once");
                assert.equal(cacheUpdateCount, 0, "Cache should have been updated only during initialisation");
                done();
            }, 100);
        });

        it("cache is updated on a timer", function(done){
            setTimeout(function(){
                assert.equal(cacheUpdateCount, 1, "Cache should have been updated once since initialisation");
                done();
            }, 1100);
        });
    });
});