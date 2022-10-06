# Important

Hobknob is deprecated and no longer actively supported. 

If you are a contributor willing to take this project over then please get in touch via [search-experience@opentable.com](mailto:search-experience@opentable.com)

## hobknob-client-nodejs

> A node client to retrieve feature toggles stored in Etcd.

[![Build Status](https://travis-ci.org/opentable/hobknob-client-nodejs.svg?branch=master)](https://travis-ci.org/opentable/hobknob-client-nodejs)

[![NPM](https://nodei.co/npm/hobknob-client-nodejs.png)](https://nodei.co/npm/hobknob-client-nodejs)

## Installation

```
npm install hobknob-client-nodejs
```

## Usage

```javascript
var Client = require('hobknob-client-nodejs');

var client = new Client("application-name", {
    etcdHost: "127.0.0.1",
    etcdPort: 4001,
    cacheIntervalMs: 60000
});

client.on("error", function(err) {
    console.log(err);
});

client.on("updated-cache", function(togglesChanged){
    console.log('updated-cache' + JSON.stringify(togglesChanged)); // contains an array of toggles that changed in the last update
});

client.initialise(function(err) {

    if(err){
        throw err;
    }

    console.log(client.getOrDefault("toggle2", true));
});
```

### Important Note

The "error" event must be subscribed to, otherwise errors will cause the application to exit

```javascript
client.on("error", function(err) { });
```

## Etcd

Feature toggles are stored in Etcd using the following convention:
`http://host:port/v2/keys/v1/toggles/applicationName/toggleName`

## API

### Client(applicationName, [config])

Creates a new feature toggle client

```javascript
var Client = require("hobknob-client-nodejs");
var client = new Client("application-name", { etcdHost: "127.0.0.1" });
```

- `applicationName` the name of the application used to find feature toggles
- `config` (optional)
  - `etcdHost` (default: "127.0.0.1")
  - `etcdPort` (default: 4001)
  - `cacheIntervalMs` interval for the cache update, which loads all the applications toggles into memory (default: 60000)

### .on(eventName, callback)

Subscribes to events emitted by the client.

- `eventName` - name of the event to listen to (see below for possible event names)
- `callback` - callback that is called with different arguments per event when the event is fired (see below for event callbacks)

Events:
- `error` -  function(err){ }` // required, will return a javascript error object
- `updated-cache` - function(togglesChanged){ }` // optional, will return a list of toggles that changed in the last update

example:
```javascript
client.on('updated-cache', function(toggles){
  console.log(toggles);
});

// output
[
  { name: 'mytoggle', old: false, new: true },
  ...
]
```

### .getOrDefault(toggleName, [secondaryKey], defaultValue)

Gets the value of a feature toggle (`true` or `false`) if exists, otherwise return the default value (`true` or `false`)

```javascript
var isFeatureToggle1Enabled = client.getOrDefault('featureToggle1', false);
```

- `toggleName` - the name of the toggle, used with the application name to get the feature toggle value
- `secondaryKey` - [optional] used when accessing a multi feature-toggle (e.g. `client.getOrDefault('domainFeature', 'com', false)`)
- `defaultValue` - the value to return if the toggle value is not found or if there is an error

### .getAll()

Gets the values for all features for the application.

```javascript
var features = client.getAll();

features.should.be.eql({
  "feature1": "true",
  "feature2": "false",
  "domFeature/com": "true",
  "domFeature/couk": "false"
});

```
