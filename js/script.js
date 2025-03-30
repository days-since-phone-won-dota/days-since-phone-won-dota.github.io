const PHONE_PLAYER_ID = "80320987";
const NUMBER_OF_GAMES = 20;
var lastXGamesResults = [];

async function getLastXGames() {
  try {
    var request = await fetch(`https://api.opendota.com/api/players/${PHONE_PLAYER_ID}/matches?limit=${NUMBER_OF_GAMES}`);
    lastXGamesResults = await request.json();
  } catch(error) {
    console.log(error);
  }
}

// player_slot 0<=4 --> Radiant
// player_slot 128 <- 132 --> Dire
function wonGame(game) {
  if (game.radiant_win && game.player_slot <= 4) {
    return true;
  }
  if (game.player_slot <= 132 && game.player_slot >= 128 && game.radiant_win == false) {
    return true;
  }
  return false;
}

function numberOfGamesSinceLastWin() {
  for (i=0; i<NUMBER_OF_GAMES; i++) {
    var game = lastXGamesResults[i];
    if (wonGame(game)) {
      return i;
    }
  }
  return false;
}

function numberOfWinsPastXGames() {
  var count = 0;
  for (i=0; i<NUMBER_OF_GAMES; i++) {
    var game = lastXGamesResults[i];
    if (wonGame(game)) {
      count++;
    }
  }
  return count
}

function hoursSinceLastWin() {
  current_time = Math.round(Date.now() / 1000);
  last_won_game_details = lastXGamesResults[numberOfGamesSinceLastWin()];
  last_won_game_start_time = last_won_game_details.start_time;
  last_won_game_duration = last_won_game_details.duration;
  last_won_game_end_time = last_won_game_start_time + last_won_game_duration;
  return Math.round((current_time - last_won_game_end_time) / 3600);
}