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
  number_of_games = 0;
  hard_limit = 20;
  for (i=number_of_games; i < hard_limit; i++) {
    var res = await lastGamesWinLoss(i+1);
    if (res.win == 1) {
      return i;
    }
  }
  return false;
}

async function lastWonGameDetails() {
  var number_of_games_since_last_win = await numberOfGamesSinceLastWin();
  var limit = number_of_games_since_last_win + 1;
  var response = await fetch(`https://api.opendota.com/api/players/${PHONE_PLAYER_ID}/matches?limit=${limit}`)
  var json_body = await response.json();
  var last_won_game_details = await json_body.slice(-1);
  return last_won_game_details[0];
}

async function lastXGamesNumberOfWins(number_of_games) {
  var lastXGamesResults = await lastGamesWinLoss(number_of_games);
  var number_of_wins = lastXGamesResults.win;
  return number_of_wins;
}

async function hoursSinceLastWin() {
  current_time = Math.round(Date.now() / 1000);
  last_won_game_details = await lastWonGameDetails();
  last_won_game_start_time = await last_won_game_details.start_time;
  last_won_game_duration = await last_won_game_details.duration;
  last_won_game_end_time = last_won_game_start_time + last_won_game_duration;
  return Math.round((current_time - last_won_game_end_time) / 3600);
}