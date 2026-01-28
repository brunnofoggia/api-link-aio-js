TOKEN=$(curl -s http://localhost:8081/auth \
  -H "Content-Type: application/x-www-form-urlencoded" \
  --data-urlencode "grant_type=client_credentials" \
  --data-urlencode "client_id=test-client" \
  --data-urlencode "client_secret=test-secret" \
  | jq -r .access_token)

echo "$TOKEN"; echo
