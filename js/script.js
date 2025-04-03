  const PHONE_PLAYER_ID = "80320987";
  const NUMBER_OF_GAMES = 20;
  const TOTALS_KILLS_INDEX = 0;
  const TOTALS_DEATHS_INDEX = 1;
  const TOTALS_ASSISTS_INDEX = 2;
  const TOTALS_TP_PURCHASED = 18;
  var lastXGamesResults = [];
  var lastXGamesTotals = [];

  function addCursorToggleListener() {
    var cursorToggleInput = document.getElementById("cursor-toggle");
    var toggleStatus = document.getElementById("toggle-status");

    cursorToggleInput.addEventListener("change", function () {
      if (this.checked) {
        toggleStatus.textContent = "BKB";
        document.body.style.cursor = 'url(../images/black_king_bar_0.png), auto';
      } else {
        toggleStatus.textContent = "NO BKB";
        document.body.style.cursor = 'url(../images/black_king_bar_180.png), auto';
      }
    })
  }
        

  async function getLowestWinrateHeroes() {
    const heroesUrl = "https://api.opendota.com/api/heroes";
    const playerUrl = `https://api.opendota.com/api/players/${PHONE_PLAYER_ID}/heroes`;

    try {
        // Fetch hero list (to map hero_id to hero names)
        const heroesResponse = await fetch(heroesUrl);
        const heroesData = await heroesResponse.json();
        
        // Create a mapping { hero_id: hero_name }
        const heroMap = {};
        heroesData.forEach(hero => {
            heroMap[hero.id] = hero.localized_name;
        });

        // Fetch player's hero stats
        const response = await fetch(playerUrl);
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const heroes = await response.json();

        // Filter heroes with more than 50 games played
        const filteredHeroes = heroes.filter(h => h.games > 50);

        // Sort by lowest win rate
        filteredHeroes.sort((a, b) => (a.win / a.games) - (b.win / b.games));

        // Get the bottom 5 heroes
        const lowestWinrateHeroes = filteredHeroes.slice(0, 5).map(hero => ({
            name: heroMap[hero.hero_id] || "Unknown Hero",
            games: hero.games,
            wins: hero.win,
            win_rate: (hero.win / hero.games * 100).toFixed(2) + "%"
        }));

        return lowestWinrateHeroes;

    } catch (error) {
        console.error("Error fetching data:", error.message);
    }
}

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

  function showBadges() {
    var badges = document.getElementsByClassName('badge-image');
    Array.from(badges).forEach(badge => badge.style.display = 'inline-block');
  }

  function hideBadges() {
    var badges = document.getElementsByClassName('badge-image');
    Array.from(badges).forEach(badge => badge.style.display = 'none');
  }

  function showOverlay() {
    var loadingOverlay = document.getElementById('loadingOverlay');
    loadingOverlay.classList.add('active');
  }

  function hideOverlay() {
    var loadingOverlay = document.getElementById('loadingOverlay');
    loadingOverlay.classList.remove('active');
  }

  function updateKDARatios() {
    const totalKills = getPastXGamesTotalKills();
    const totalDeaths = getPastXGamesTotalDeaths();
    const totalAssists = getPastXGamesTotalAssists();
    
    document.getElementById('kda-kills').textContent = totalKills;
    document.getElementById('kda-deaths').textContent = totalDeaths;
    document.getElementById('kda-assists').textContent = totalAssists;

    if (totalDeaths >= 200) {
      showBadges();
    }
    
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

