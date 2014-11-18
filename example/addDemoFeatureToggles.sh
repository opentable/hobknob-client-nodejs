#!/bin/sh

curl http://127.0.0.1:4001/v2/keys/v1/toggles/testApp/test1 -XPUT -d value=true

curl http://127.0.0.1:4001/v2/keys/v1/toggles/testApp/multi/@meta -XPUT -d value='{"categoryId":1}'
curl http://127.0.0.1:4001/v2/keys/v1/toggles/testApp/multi/com -XPUT -d value=true