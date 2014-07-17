# hobknob-client-nodejs

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

client.on("initialized", function() {
    
    client.get("toggle1", function(err, value) {
        console.log(value);
    });
    
    client.getOrDefault("toggle2", true, function(err, value) {
        console.log(value);
    });

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

Subscribs to events emitted by the client. 

- `error` [required]
- `initialized`
- `updating-cache`
- `updated-cache`

### .get(toggleName, callback)

Gets the value of a feature toggle (`true` or `false`) if exists, otherwise return `null`

- `toggleName` the name of the toggle, used with the application name to get the feature toggle value
- `callback` function with parameters (`err`, `value`)


### .getOrDefault(toggleName, defaultValue, callback)

Gets the value of a feature toggle (`true` or `false`) if exists, otherwise return the default value (`true` or `false`)

- `toggleName` the name of the toggle, used with the application name to get the feature toggle value
- `defaultValue` the value to return if the toggle value is not found or if there is an error
- `callback` function with parameters (`err`, `value`)