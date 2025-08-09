#!/bin/bash

# Simple Mafia Game API Test
echo "🎭 Testing Mafia Game API..."

BASE_URL="http://localhost:5000"

# Test 1: Create Game
echo "1. Creating game..."
CREATE_RESPONSE=$(curl -s -X POST "$BASE_URL/api/games" \
  -H "Content-Type: application/json" \
  -d '{"hostName":"TestHost"}')

echo "Response: $CREATE_RESPONSE"

if [[ $CREATE_RESPONSE == *"\"code\":"* ]]; then
  echo "✓ Game creation successful"
else
  echo "✗ Game creation failed"
  exit 1
fi

# Extract game code (simple grep approach)
GAME_CODE=$(echo $CREATE_RESPONSE | grep -o '"code":"[^"]*"' | cut -d'"' -f4)
echo "Game Code: $GAME_CODE"

# Test 2: Join Game
echo -e "\n2. Adding player..."
JOIN_RESPONSE=$(curl -s -X POST "$BASE_URL/api/games/$GAME_CODE/join" \
  -H "Content-Type: application/json" \
  -d '{"name":"Player1"}')

echo "Join Response: $JOIN_RESPONSE"

if [[ $JOIN_RESPONSE == *"\"playerId\":"* ]]; then
  echo "✓ Player join successful"
else
  echo "✗ Player join failed"
  exit 1
fi

# Test 3: Get Game State
echo -e "\n3. Checking game state..."
STATE_RESPONSE=$(curl -s "$BASE_URL/api/games/$GAME_CODE")
echo "State Response: $STATE_RESPONSE"

if [[ $STATE_RESPONSE == *"\"players\":"* ]]; then
  echo "✓ Game state retrieval successful"
else
  echo "✗ Game state retrieval failed"
  exit 1
fi

# Test 4: Start Game
echo -e "\n4. Starting game..."
HOST_ID=$(echo $CREATE_RESPONSE | grep -o '"hostId":"[^"]*"' | cut -d'"' -f4)
START_RESPONSE=$(curl -s -X POST "$BASE_URL/api/games/$GAME_CODE/start" \
  -H "Content-Type: application/json" \
  -d "{\"hostId\":\"$HOST_ID\",\"townNamingMode\":\"host\"}")

echo "Start Response: $START_RESPONSE"

if [[ $START_RESPONSE == *"\"phase\":\"role_assignment\""* ]]; then
  echo "✓ Game start successful"
else
  echo "✗ Game start failed"
  exit 1
fi

# Test 5: Error Handling
echo -e "\n5. Testing error handling..."
ERROR_RESPONSE=$(curl -s -w "%{http_code}" -X POST "$BASE_URL/api/games/XXXX/join" \
  -H "Content-Type: application/json" \
  -d '{"name":"Player"}')

HTTP_CODE="${ERROR_RESPONSE: -3}"
if [[ $HTTP_CODE -eq 404 ]]; then
  echo "✓ Error handling working correctly"
else
  echo "✗ Error handling failed"
fi

echo -e "\n🎉 Basic API tests completed successfully!"
echo "Game Code: $GAME_CODE"
echo "Host ID: $HOST_ID"
echo -e "\nAPI endpoints verified:"
echo "• POST /api/games (create game)"
echo "• POST /api/games/{code}/join (join game)"
echo "• GET /api/games/{code} (get game state)"
echo "• POST /api/games/{code}/start (start game)"
echo "• Error handling for invalid requests"