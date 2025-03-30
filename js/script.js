  const PHONE_PLAYER_ID = "80320987";
  const NUMBER_OF_GAMES = 20;
  const TOTALS_KILLS_INDEX = 0;
  const TOTALS_DEATHS_INDEX = 1;
  const TOTALS_ASSISTS_INDEX = 2;
  const TOTALS_TP_PURCHASED = 18;
  var lastXGamesResults = [];
  var lastXGamesTotals = [];

  async function getLastXGames() {
    try {
      var request = await fetch(`https://api.opendota.com/api/players/${PHONE_PLAYER_ID}/matches?limit=${NUMBER_OF_GAMES}`);
      lastXGamesResults = await request.json();
    } catch(error) {
      console.log(error);
    }
  }

  async function getLastXGamesTotals() {
    try {
      var request = await fetch(`https://api.opendota.com/api/players/${PHONE_PLAYER_ID}/totals?limit=${NUMBER_OF_GAMES}`)
      lastXGamesTotals = await request.json();
    } catch (error) {
      console.log(error);
    }
  }

  function getPastXGamesTotalKills() {
    return lastXGamesTotals[TOTALS_KILLS_INDEX].sum;
  }

  function getPastXGamesTotalDeaths() {
    return lastXGamesTotals[TOTALS_DEATHS_INDEX].sum;
  }

  function getPastXGamesTotalAssists() {
    return lastXGamesTotals[TOTALS_ASSISTS_INDEX].sum;
  }

  function getPastXGamesTPsPurchased() {
    return lastXGamesTotals[TOTALS_TP_PURCHASED].sum;
  }

  function updateKDARatios() {
    const totalKills = getPastXGamesTotalKills();
    const totalDeaths = getPastXGamesTotalDeaths();
    const totalAssists = getPastXGamesTotalAssists();
    
    document.getElementById('kda-kills').textContent = totalKills;
    document.getElementById('kda-deaths').textContent = totalDeaths;
    document.getElementById('kda-assists').textContent = totalAssists;
    
    // // Calculate and display KDA ratio
    // const kdaRatio = totalDeaths === 0 ? 
    //     (totalKills + totalAssists).toFixed(1) : 
    //     ((totalKills + totalAssists) / totalDeaths).toFixed(2);
    
    // const kdaRatioElement = document.createElement('div');
    // kdaRatioElement.className = 'kda-ratio';
    // kdaRatioElement.textContent = `KDA: ${kdaRatio}`;
    // kdaRatioElement.style.cssText = `
    //     font-size: 1.2em;
    //     font-weight: bold;
    //     color: var(--accent-color);
    //     margin-top: 10px;
    //     text-align: center;
    // `;
    
    // const kdaContent = document.querySelector('.kda-content');
    // kdaContent.appendChild(kdaRatioElement);
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