const PHONE_PLAYER_ID = "80320987";

async function lastGamesWinLoss(number_of_games) {
  try {
    var response = await fetch(`https://api.opendota.com/api/players/${PHONE_PLAYER_ID}/wl?limit=${number_of_games}`);
    result = await response.json();
    return result;
  } catch(error) {
    console.log(error);
  }
}

async function winLastGame() {
  lastGameResult = await lastGamesWinLoss(1);
  if (lastGameResult.win == 1) {
    return true;
  }
  return false;
}

async function numberOfGamesSinceLastWin() {
  number_of_games = 1;
  hard_limit = 20;
  for (i=number_of_games; i<=hard_limit; i++) {
    var res = await lastGamesWinLoss(i);
    if (res.win == 1) {
      return i;
    }
  }
  return false;
}

async function lastWonGameDetails() {
  var number_of_games_since_last_win = await numberOfGamesSinceLastWin();
  if (number_of_games_since_last_win) {
    var response = await fetch(`https://api.opendota.com/api/players/${PHONE_PLAYER_ID}/matches?limit=${number_of_games_since_last_win}`)
    var json_body = await response.json();
    var last_won_game_details = await json_body.slice(-1);
    return last_won_game_details[0];
  }
  return false
}

async function lastXGamesNumberOfWins(number_of_games) {
  var lastXGamesResults = await lastGamesWinLoss(number_of_games);
  var number_of_wins = lastXGamesResults.win;
  return number_of_wins;
}

async function hoursSinceLastWin() {
  current_time = Date.now() / 1000;
  last_won_game_details = await lastWonGameDetails();
  last_won_game_start_time = await last_won_game_details.start_time;
  last_won_game_duration = await last_won_game_details.duration;
  return Math.round((current_time - last_won_game_start_time + last_won_game_duration) / 3600);
}