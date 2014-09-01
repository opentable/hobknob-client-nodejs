var assert = require("assert"),
    nock = require("nock"),
    http = require("http"),
    Client = require("../src/Client.js"),
    Etcd = require("node-etcd"),
    etcd = new Etcd(),
    useFakeEtcdResponses = true,
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
            client.initialise(function(err){
                done(err);
            });
        });

        afterEach(function(){
            client.dispose();
            client = null;
        });

        it("should get a true value for an existing key", function(){
            var value = client.get('onToggle');
            assert.equal(value, true);
        });

        it("should get a false value for an existing key", function(){
            var value = client.get('offToggle');
            assert.equal(value, false);
        });

        it("should return null for a non-existing key", function(){
            var value = client.get('noToggle');
            assert.equal(value, null);
        });

        it("should return null for a non-bool value", function(){
            var value = client.get('noBoolToggle')
            assert.equal(value, null);
        });
    });

    describe("simple get or default", function(){
        var client;

        beforeEach(function(done){
            client = new Client("testApp");
            client.on("error", function(err){
                assert.fail(err);
            });
            client.initialise(function(err){
                done(err);
            });
        });

        afterEach(function(){
            client.dispose();
            client = null;
        });

        it("should get a true value for an existing key", function(){
            var value = client.getOrDefault('onToggle', false);
            assert.equal(value, true);
        });

        it("should get a false value for an existing key", function(){
            var value = client.getOrDefault('offToggle', true);
            assert.equal(value, false);
        });

        it("should return a default for a non-existing key", function(){
            var value = client.getOrDefault('noToggle', true);
            assert.equal(value, true);
        });

        it("should return a default for a non-bool value", function(){
            var value = client.getOrDefault('noBoolToggle', true);
            assert.equal(value, true);
        });
    });

    describe("application does not have any feature toggles set", function() {
        var client;

        beforeEach(function(done){
            client = new Client("anotherApp");
            client.on("error", function(err){
                assert.fail(err);
            });
            client.initialise(function(err){
                done(err);
            });
        });

        afterEach(function(){
            client.dispose();
            client = null;
        });

        it("should not fail when updating the cache", function(){
            var value = client.get('toggle');
            assert.equal(value, null, "value should be null");
        });
    });

    describe("etcd instance is down", function() {
        var client, caughtError;

        beforeEach(function(done){
            client = new Client("testApp", { etcdPort: 123456 });
            client.on("error", function(err){
              assert.fail(err);
            });
            client.initialise(function(err){
              caughtError = true;
              done();
            });
        });

        afterEach(function(){
            client.dispose();
            client = null;
        });

        it("should emit an error when initializing", function(){
            assert.equal(caughtError, true);
        });

        it("should return an error when getting a toggle", function(done){
            try {
              var value = client.get('toggle');
            }
            catch(exception){
              done(!exception ? new Error("expecting an error when cache initialisation failed") : undefined);
            }
        });
    });

    describe("many gets", function(){
        var client, cacheUpdatingCount, cacheUpdateCount;

        beforeEach(function(done){
            client = new Client("testApp");
            client.initialise(function(err){
                done(err);
            });
        });

        afterEach(function(){
            client.dispose();
            client = null;
        });

        it("should get the same value for the same key if called twice", function(){
            var val1 = client.get('onToggle');
            var val2 = client.get('onToggle');
            assert.equal(val1, val2);
        });

        it("should perform well once data is cached", function(){
            var updates = 0, startTime = 0, endTime = 0, runs = 10000;
            var start = process.hrtime();
            for(var i = 0; i < runs; i++){
                client.get('onToggle');
            }
            var duration = process.hrtime(start);
            var timeTaken = (duration[0]*1000) + (duration[1]/1000);
            assert(timeTaken < 2000, "Required < 2000ms, got " + timeTaken + "ms");
        });
    });

    describe("cache updating", function(){
        var client, cacheUpdateCount;

        beforeEach(function(done){
            cacheUpdateCount = 0;
            client = new Client("testApp", {cacheIntervalMs: 1000});

            client.on("error", function(err){
              assert.fail(err);
            });

            client.initialise(function(err){
                if (useFakeEtcdResponses) {
                    // need to re-intercept this call, as nock removes intercepts after being called once
                    nock("http://127.0.0.1:4001")
                        .get("/v2/keys/v1/toggles/testApp?recursive=true")
                        .reply(200, testAppFeatureToggles);
                }
                done(err);
            });

        });

        afterEach(function(){
            client.dispose();
            client = null;
        });

        it("cache is updated on a timer", function(done){
            client.on("updated-cache", function(value){
              done();
            });
        });
    });
});
