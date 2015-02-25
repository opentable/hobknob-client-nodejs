var assert = require("assert"),
    nock = require("nock"),
    http = require("http"),
    Client = require("../src/Client.js"),
    Etcd = require("node-etcd"),
    should = require("should"),
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
                        },
                        {
                            "key": "/v1/toggles/testApp/multiFeature",
                            "dir": true,
                            "modifiedIndex": 4465,
                            "createdIndex": 4465,
                            "nodes": [
                                {
                                    "key": "/v1/toggles/testApp/multiFeature/@meta",
                                    "value": "{\"categoryId\":2}",
                                    "modifiedIndex": 6308,
                                    "createdIndex": 6308
                                },
                                {
                                    "key": "/v1/toggles/testApp/multiFeature/en-GB",
                                    "value": "true",
                                    "modifiedIndex": 6316,
                                    "createdIndex": 6316
                                },
                                {
                                    "key": "/v1/toggles/testApp/multiFeature/en-US",
                                    "value": "true",
                                    "modifiedIndex": 6318,
                                    "createdIndex": 6318
                                }
                            ]
                        }
                    ],
                    "modifiedIndex": 3,
                    "createdIndex": 3
                }};

            nock("http://127.0.0.1:4001")
                .get("/v2/keys/v1/toggles/testApp?recursive=true")
                .reply(200, testAppFeatureToggles);

            emptyAppFeatureToggles = {
                "action": "get",
                "node": {
                    "key": "/v1/toggles/emptyApp",
                    "dir": true,
                    "nodes": [],
                    "modifiedIndex": 3,
                    "createdIndex": 3
                }};

            nock("http://127.0.0.1:4001")
                .get("/v2/keys/v1/toggles/emptyApp?recursive=true")
                .reply(200, emptyAppFeatureToggles);


            var nonExistantAppFeatureToggles = {
                "errorCode": 100,
                "message": "Key not found",
                "cause": "/v1/toggles/nonExistantApp",
                "index": 4465
            };

            nock("http://127.0.0.1:4001")
                .get("/v2/keys/v1/toggles/nonExistantApp?recursive=true")
                .reply(404, nonExistantAppFeatureToggles);

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
                throw err;
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
            client.get('onToggle').should.be.true;
        });

        it("should get a false value for an existing key", function(){
            client.get('offToggle').should.be.false;
        });

        it("should return null for a non-existing key", function(){
            should.not.exist(client.get('noToggle'));
        });

        it("should return null for a non-bool value", function(){
            should.not.exist(client.get('noBoolToggle'));
        });

        it("should return null for a multi feature toggle when not passing secondary key", function(){
            should.not.exist(client.get('multiFeature'));
        });

        it("should return the value of a multi feature toggle", function(){
            should.exist(client.get("multiFeature", "en-GB"));
        });
    });

    describe("simple get or default", function(){
        var client;

        beforeEach(function(done){
            client = new Client("testApp");
            client.on("error", function(err){
                throw err;
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
            client.getOrDefault('onToggle', false).should.be.true;
        });

        it("should get a false value for an existing key", function(){
            client.getOrDefault('offToggle', true).should.be.false;
        });

        it("should return a default for a non-existing key", function(){
            client.getOrDefault('noToggle', true).should.be.true;
        });

        it("should return a default for a non-bool value", function(){
            client.getOrDefault('noBoolToggle', true).should.be.true;
        });

        it("should return the default when secondary key is not present when getting a multi feature toggle", function(){
            client.getOrDefault('multiFeature', true).should.be.true;
        });
        
        it("should return the correct value for a multi feature toggle", function(){
            client.getOrDefault('multiFeature', 'en-GB', false).should.be.true;
        });

        it("should return the default value for a multi feature toggle with a secondary key that is not present in etcd", function(){
            client.getOrDefault('multiFeature', 'monkey', true).should.be.true;
        });
    });

    describe("get all", function() {

        var buildClient = function(applicationName, cb){
            var client = new Client(applicationName);
            client.on("error", function(err){
                throw err;
            });
            client.initialise(function(err){
                if (err) {
                    throw err;
                }
                cb(client);
                client.dispose();
            });
        };

        it("should return all key value pairs for an application", function(done){
            buildClient("testApp", function(client){
                var expected = {
                    "onToggle": true,
                    "offToggle": false,
                    "multiFeature/en-GB": true,
                    "multiFeature/en-US": true,
                    "noBoolToggle": null
                };
                client.getAll().should.be.eql(expected);
                done();
            });
        });

        it("should return a different object to the client cache object", function(done){
            buildClient("testApp", function(client){

                var allFeatures = client.getAll();
                delete allFeatures["onToggle"];
                allFeatures.Monkey = "Bananas";

                var expected = {
                    "onToggle": true,
                    "offToggle": false,
                    "multiFeature/en-GB": true,
                    "multiFeature/en-US": true,
                    "noBoolToggle": null
                };
                client.getAll().should.be.eql(expected);
                done();
            });
        });

        it("should return an empty object for an application that does not have any keys", function(done){
            buildClient("emptyApp", function(client){
                client.getAll().should.be.empty;
                done();
            });
        });

        it("should return empty for an application that does not exist", function(done){
            buildClient("nonExistantApp", function(client){
                client.getAll().should.be.empty;
                done();
            });
        });

    });

    describe("application does not have any feature toggles set", function() {
        var client;

        beforeEach(function(done){
            client = new Client("nonExistantApp");
            client.on("error", function(err){
                throw err;
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
            should.not.exist(client.get('toggle'));
        });
    });

    describe("etcd instance is down", function() {
        var client, caughtError;

        beforeEach(function(done){
            client = new Client("testApp", { etcdPort: 123456 });
            client.on("error", function(err){
              throw err;
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
            caughtError.should.be.true;
        });

        it("should return an error when getting a toggle", function(done){
            try {
              client.get('toggle');
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
            val1.should.equal(val2);
        });

        it("should perform well once data is cached", function(){
            var updates = 0, startTime = 0, endTime = 0, runs = 10000;
            var start = process.hrtime();
            for(var i = 0; i < runs; i++){
                client.get('onToggle');
            }
            var duration = process.hrtime(start);
            var timeTaken = (duration[0]*1000) + (duration[1]/1000);
            timeTaken.should.be.lessThan(2000);
        });
    });

    describe("cache updating", function(){
        var client, cacheUpdateCount;

        beforeEach(function(done){
            cacheUpdateCount = 0;
            client = new Client("testApp", {cacheIntervalMs: 1000});

            client.on("error", function(err){
              throw err;
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
              value.should.eql([]);
              done();
            });
        });
    });
});
