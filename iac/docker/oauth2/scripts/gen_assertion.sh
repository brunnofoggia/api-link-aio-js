ASSERTION=$(CLIENT_ID=test-client \
  AUD=http://localhost:8080/auth \
  CLIENT_PRIVATE_KEY=client/client_private.pem \
  ASSERTION_TTL_SECONDS=60 \
  node client/gen_assertion_jwt.js)

echo "$ASSERTION"; echo
