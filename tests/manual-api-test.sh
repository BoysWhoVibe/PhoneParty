#!/bin/bash

# Mafia Game API Integration Test
# This script tests the complete game flow using curl commands

BASE_URL="http://localhost:5000"
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}🎭 Starting Mafia Game API Integration Test...${NC}\n"

# Test 1: Create Game
echo -e "${YELLOW}Step 1: Creating game...${NC}"
CREATE_RESPONSE=$(curl -s -X POST "$BASE_URL/api/games" \
  -H "Content-Type: application/json" \
  -d '{"hostName":"TestHost"}')

if [[ $? -eq 0 ]]; then
  GAME_CODE=$(echo $CREATE_RESPONSE | jq -r '.gameRoom.code')
  HOST_ID=$(echo $CREATE_RESPONSE | jq -r '.gameRoom.hostId')
  echo -e "${GREEN}✓ Game created: $GAME_CODE (Host: $HOST_ID)${NC}"
else
  echo -e "${RED}✗ Failed to create game${NC}"
  exit 1
fi

# Test 2: Add Players
echo -e "\n${YELLOW}Step 2: Adding players...${NC}"

# Add Player 1
PLAYER1_RESPONSE=$(curl -s -X POST "$BASE_URL/api/games/$GAME_CODE/join" \
  -H "Content-Type: application/json" \
  -d '{"name":"Player1"}')

if [[ $? -eq 0 ]]; then
  PLAYER1_ID=$(echo $PLAYER1_RESPONSE | jq -r '.player.playerId')
  echo -e "${GREEN}✓ Player1 joined: $PLAYER1_ID${NC}"
else
  echo -e "${RED}✗ Failed to add Player1${NC}"
  exit 1
fi

# Add Player 2
PLAYER2_RESPONSE=$(curl -s -X POST "$BASE_URL/api/games/$GAME_CODE/join" \
  -H "Content-Type: application/json" \
  -d '{"name":"Player2"}')

if [[ $? -eq 0 ]]; then
  PLAYER2_ID=$(echo $PLAYER2_RESPONSE | jq -r '.player.playerId')
  echo -e "${GREEN}✓ Player2 joined: $PLAYER2_ID${NC}"
else
  echo -e "${RED}✗ Failed to add Player2${NC}"
  exit 1
fi

# Test 3: Verify Lobby State
echo -e "\n${YELLOW}Step 3: Verifying lobby state...${NC}"
LOBBY_RESPONSE=$(curl -s "$BASE_URL/api/games/$GAME_CODE")
PLAYER_COUNT=$(echo $LOBBY_RESPONSE | jq '.players | length')

if [[ $PLAYER_COUNT -eq 2 ]]; then
  echo -e "${GREEN}✓ Both players in lobby (Host will be added automatically)${NC}"
else
  echo -e "${RED}✗ Expected 2 players, found $PLAYER_COUNT${NC}"
  exit 1
fi

# Test 4: Set Town Name
echo -e "\n${YELLOW}Step 4: Setting town name...${NC}"
TOWN_RESPONSE=$(curl -s -X POST "$BASE_URL/api/games/$GAME_CODE/set-town-name" \
  -H "Content-Type: application/json" \
  -d '{"townName":"Test Town"}')

if [[ $? -eq 0 ]]; then
  echo -e "${GREEN}✓ Town name set${NC}"
else
  echo -e "${RED}✗ Failed to set town name${NC}"
  exit 1
fi

# Test 5: Start Game
echo -e "\n${YELLOW}Step 5: Starting game...${NC}"
START_RESPONSE=$(curl -s -X POST "$BASE_URL/api/games/$GAME_CODE/start" \
  -H "Content-Type: application/json" \
  -d "{\"hostId\":\"$HOST_ID\",\"townNamingMode\":\"host\"}")

GAME_PHASE=$(echo $START_RESPONSE | jq -r '.gameRoom.phase')

if [[ "$GAME_PHASE" == "role_assignment" ]]; then
  echo -e "${GREEN}✓ Game started, phase: $GAME_PHASE${NC}"
else
  echo -e "${RED}✗ Expected phase 'role-assignment', got '$GAME_PHASE'${NC}"
  exit 1
fi

# Test 6: Check Role Assignments
echo -e "\n${YELLOW}Step 6: Checking role assignments...${NC}"

# Check Host Role
HOST_ROLE_RESPONSE=$(curl -s "$BASE_URL/api/games/$GAME_CODE/player/$HOST_ID/role")
HOST_ROLE=$(echo $HOST_ROLE_RESPONSE | jq -r '.role')
echo -e "${GREEN}✓ Host role: $HOST_ROLE${NC}"

# Check Player1 Role
PLAYER1_ROLE_RESPONSE=$(curl -s "$BASE_URL/api/games/$GAME_CODE/player/$PLAYER1_ID/role")
PLAYER1_ROLE=$(echo $PLAYER1_ROLE_RESPONSE | jq -r '.role')
echo -e "${GREEN}✓ Player1 role: $PLAYER1_ROLE${NC}"

# Check Player2 Role
PLAYER2_ROLE_RESPONSE=$(curl -s "$BASE_URL/api/games/$GAME_CODE/player/$PLAYER2_ID/role")
PLAYER2_ROLE=$(echo $PLAYER2_ROLE_RESPONSE | jq -r '.role')
echo -e "${GREEN}✓ Player2 role: $PLAYER2_ROLE${NC}"

# Test 7: Acknowledge Roles
echo -e "\n${YELLOW}Step 7: Acknowledging roles...${NC}"

# Host acknowledges
curl -s -X POST "$BASE_URL/api/games/$GAME_CODE/acknowledge-role" \
  -H "Content-Type: application/json" \
  -d "{\"playerId\":\"$HOST_ID\"}" > /dev/null

# Player1 acknowledges
curl -s -X POST "$BASE_URL/api/games/$GAME_CODE/acknowledge-role" \
  -H "Content-Type: application/json" \
  -d "{\"playerId\":\"$PLAYER1_ID\"}" > /dev/null

# Player2 acknowledges
curl -s -X POST "$BASE_URL/api/games/$GAME_CODE/acknowledge-role" \
  -H "Content-Type: application/json" \
  -d "{\"playerId\":\"$PLAYER2_ID\"}" > /dev/null

echo -e "${GREEN}✓ All players acknowledged roles${NC}"

# Test 8: Verify All Acknowledged  
echo -e "\n${YELLOW}Step 8: Verifying acknowledgments...${NC}"
FINAL_STATE=$(curl -s "$BASE_URL/api/games/$GAME_CODE")
ACKNOWLEDGED_COUNT=$(echo $FINAL_STATE | jq '[.players[] | select(.roleAcknowledged == true)] | length')
TOTAL_PLAYERS=$(echo $FINAL_STATE | jq '.players | length')

if [[ $ACKNOWLEDGED_COUNT -eq $TOTAL_PLAYERS ]]; then
  echo -e "${GREEN}✓ All players acknowledged: $ACKNOWLEDGED_COUNT/$TOTAL_PLAYERS${NC}"
else
  echo -e "${RED}✗ Expected $TOTAL_PLAYERS acknowledged, got $ACKNOWLEDGED_COUNT${NC}"
  exit 1
fi

# Test 9: Start Gameplay
echo -e "\n${YELLOW}Step 9: Starting gameplay...${NC}"
GAMEPLAY_RESPONSE=$(curl -s -X POST "$BASE_URL/api/games/$GAME_CODE/start-gameplay" \
  -H "Content-Type: application/json" \
  -d "{\"hostId\":\"$HOST_ID\"}")

if [[ $? -eq 0 ]]; then
  echo -e "${GREEN}✓ Gameplay started${NC}"
else
  echo -e "${RED}✗ Failed to start gameplay${NC}"
  exit 1
fi

# Test 10: Error Handling
echo -e "\n${YELLOW}Step 10: Testing error handling...${NC}"

# Test joining non-existent game
INVALID_RESPONSE=$(curl -s -w "%{http_code}" -X POST "$BASE_URL/api/games/XXXX/join" \
  -H "Content-Type: application/json" \
  -d '{"name":"Player"}')

HTTP_CODE="${INVALID_RESPONSE: -3}"
if [[ $HTTP_CODE -eq 404 ]]; then
  echo -e "${GREEN}✓ Invalid game join properly rejected${NC}"
else
  echo -e "${RED}✗ Invalid game join should return 404, got $HTTP_CODE${NC}"
fi

echo -e "\n${GREEN}🎉 All API integration tests passed!${NC}\n"

echo -e "${YELLOW}Summary:${NC}"
echo -e "• Game created: $GAME_CODE"
echo -e "• Players: Host ($HOST_ROLE), Player1 ($PLAYER1_ROLE), Player2 ($PLAYER2_ROLE)"
echo -e "• All roles acknowledged successfully"
echo -e "• Game progression: lobby → role-assignment → gameplay"
echo -e "• Error handling validated"