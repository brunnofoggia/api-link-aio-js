TOKEN=$(ASSERTION=$(CLIENT_ID=test-client AUD=http://localhost:8080/auth CLIENT_PRIVATE_KEY=client/client_private.pem ASSERTION_TTL_SECONDS=300 node client/gen_assertion_jwt.js) && \
curl -s http://localhost:8080/auth \
  -H "Content-Type: application/x-www-form-urlencoded" \
  --data-urlencode "grant_type=client_credentials" \
  --data-urlencode "client_id=test-client" \
  --data-urlencode "client_assertion_type=urn:ietf:params:oauth:client-assertion-type:jwt-bearer" \
  --data-urlencode "client_assertion=$ASSERTION" \
  | jq -r .access_token)

echo "$TOKEN"; echo
