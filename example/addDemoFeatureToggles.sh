#!/bin/sh

curl http://127.0.0.1:4001/v2/keys/v1/toggles/testApp/test1 -XPUT -d value=true