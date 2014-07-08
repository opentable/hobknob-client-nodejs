var should = require("should"),
    Client = require("../src/Client.js"),
    client = new Client("testApp")
    Etcd = require("node-etcd"),
    etcd = new Etcd();

describe("client", function(){

    describe("simple get", function(){

        beforeEach(function(done){

            // todo: do this without callbacks
            etcd.set('v1/toggles/testApp/onToggle', 'true', function(){
                etcd.set('v1/toggles/testApp/offToggle', 'false', function(){
                    etcd.set('v1/toggles/testApp/noBoolToggle', 'noABool', function(){
                        done();
                    })
                });
            });
        });

        afterEach(function(done){
            etcd.del("v1/toggles/testApp/", { recursive: true }, done);
        });

        it("should get a true value for an existing key", function(done){
            client.get('onToggle', function(err, value){
                value.should.be.true;
                done();
            });
        });

        it("should get a false value for an existing key", function(done){
            client.get('offToggle', function(err, value){
                value.should.be.false;
                done();
            });
        });

        it("should return null for a non-existing key", function(done){
            client.get('noToggle', function(err, value){
                (value === null).should.be.true;
                done();
            });
        });

        it("should return null for a non-bool value", function(done){
            client.get('noBoolToggle', function(err, value){
                (value === null).should.be.true;
                done();
            });
        });

    });
});