const PHONE_PLAYER_ID = "80320987";
const NUMBER_OF_GAMES = 20;
const TOTALS_KILLS_INDEX = 0;
const TOTALS_DEATHS_INDEX = 1;
const TOTALS_ASSISTS_INDEX = 2;
const TOTALS_TP_PURCHASED = 18;
const PARENT = "days-since-phone-won-dota.github.io&parent=localhost";
var lastXGamesResults = [];
var lastXGamesTotals = [];
let videoLinks = []; // for videos
let currentIndex = 0; // for videos

/* Tipping feature */
const tipButton = document.querySelector(".tip-button");
let tipContainer;
let tipHeroIndex = 0;
let tipHeroes = ["Pudge", "Hoodwink", "Oracle", "Necrolyte"];
let tipWebhookSite = "https://www.freevisitorcounters.com/en/home/counter/1323914/t/13"
let tipCounterImageSrc = "https://www.freevisitorcounters.com/en/counter/render/1323914/t/13"

function addCursorToggleListener() {
  var cursorToggleInput = document.getElementById("cursor-toggle");
  var toggleStatus = document.getElementById("toggle-status");

  cursorToggleInput.addEventListener("change", function () {
    if (this.checked) {
      const audio = new Audio('../assets/black_king_bar.mp3.mpeg');
      audio.play();
      toggleStatus.textContent = "BKB";
      document.body.style.cursor = "url(../images/black_king_bar_0.png), auto";
      document.querySelectorAll(".side-button").forEach((button) => {
        button.classList.remove("bkb-cursor", "bkb-cursor-reverse");
        button.classList.add("bkb-cursor");
      });
    } else {
      toggleStatus.textContent = "NO BKB";
      document.body.style.cursor =
        "url(../images/black_king_bar_180.png), auto";
      document.querySelectorAll(".side-button").forEach((button) => {
        button.classList.remove("bkb-cursor", "bkb-cursor-reverse");
        button.classList.add("bkb-cursor-reverse");
      });
    }
  });
}

function setVideo(index) {
  const iframe = document.getElementById("daily-dose-video");
  iframe.src = videoLinks[index];
}

async function loadVideos() {
  try {
    document.getElementById("prev-button").addEventListener("click", () => {
      if (videoLinks.length === 0) return;
      currentIndex = (currentIndex - 1 + videoLinks.length) % videoLinks.length;
      setVideo(currentIndex);
    });

    document.getElementById("next-button").addEventListener("click", () => {
      if (videoLinks.length === 0) return;
      currentIndex = (currentIndex + 1) % videoLinks.length;
      setVideo(currentIndex);
    });

    const response = await fetch("../videos/twitch_clips.txt");
    const text = await response.text();
    videoLinks = text
      .trim()
      .split("\n")
      .map((link) => {
        cleaned_link = link.replace(/\r$/, "");
        return `${cleaned_link}${PARENT}`;
      });
    if (videoLinks.length > 0) {
      setVideo(currentIndex);
    }
  } catch (err) {
    console.error("Error loading video list:", err);
  }
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
    heroesData.forEach((hero) => {
      heroMap[hero.id] = hero.localized_name;
    });

    // Fetch player's hero stats
    const response = await fetch(playerUrl);
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const heroes = await response.json();

    // Filter heroes with more than 50 games played
    const filteredHeroes = heroes.filter((h) => h.games > 50);

    // Sort by lowest win rate
    filteredHeroes.sort((a, b) => a.win / a.games - b.win / b.games);

    // Get the bottom 5 heroes
    const lowestWinrateHeroes = filteredHeroes.slice(0, 5).map((hero) => ({
      name: heroMap[hero.hero_id] || "Unknown Hero",
      games: hero.games,
      wins: hero.win,
      win_rate: ((hero.win / hero.games) * 100).toFixed(2) + "%",
    }));

    return lowestWinrateHeroes;
  } catch (error) {
    console.error("Error fetching data:", error.message);
  }
}

async function getLastXGames() {
  try {
    var request = await fetch(
      `https://api.opendota.com/api/players/${PHONE_PLAYER_ID}/matches?limit=${NUMBER_OF_GAMES}`
    );
    lastXGamesResults = await request.json();
  } catch (error) {
    console.log(error);
  }
}

async function getLastXGamesTotals() {
  try {
    var request = await fetch(
      `https://api.opendota.com/api/players/${PHONE_PLAYER_ID}/totals?limit=${NUMBER_OF_GAMES}`
    );
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
  var badges = document.getElementsByClassName("badge-image");
  Array.from(badges).forEach((badge) => (badge.style.display = "inline-block"));
}

function hideBadges() {
  var badges = document.getElementsByClassName("badge-image");
  Array.from(badges).forEach((badge) => (badge.style.display = "none"));
}

function showOverlay() {
  var loadingOverlay = document.getElementById("loadingOverlay");
  loadingOverlay.classList.add("active");
}

async function randomizeEncouragement() {
  var req = await fetch("../assets/words_of_encouragement.txt");
  var res = await req.text();
  var words = res.split("\n");
  var encouragementText = document.getElementById("loading-message");
  encouragementText.innerHTML = "<strong>Words of Encouragement for Phone: </strong>" +
   words[Math.floor(Math.random() * words.length)];
}

function hideOverlay() {
  var loadingOverlay = document.getElementById("loadingOverlay");
  loadingOverlay.classList.remove("active");
  // var tipPhoneAudio = document.getElementById("tipPhone");
  // tipPhoneAudio.play();
}

function updateKDARatios() {
  const totalKills = getPastXGamesTotalKills();
  const totalDeaths = getPastXGamesTotalDeaths();
  const totalAssists = getPastXGamesTotalAssists();

  document.getElementById("kda-kills").textContent = totalKills;
  document.getElementById("kda-deaths").textContent = totalDeaths;
  document.getElementById("kda-assists").textContent = totalAssists;

  if (totalDeaths >= 200) {
    showBadges();
  }
}

// player_slot 0<=4 --> Radiant
// player_slot 128 <- 132 --> Dire
function wonGame(game) {
  if (game.radiant_win && game.player_slot <= 4) {
    return true;
  }
  if (
    game.player_slot <= 132 &&
    game.player_slot >= 128 &&
    game.radiant_win == false
  ) {
    return true;
  }
  return false;
}

function numberOfGamesSinceLastWin() {
  for (i = 0; i < NUMBER_OF_GAMES; i++) {
    var game = lastXGamesResults[i];
    if (wonGame(game)) {
      return i;
    }
  }
  return false;
}

function numberOfWinsPastXGames() {
  var count = 0;
  for (i = 0; i < NUMBER_OF_GAMES; i++) {
    var game = lastXGamesResults[i];
    if (wonGame(game)) {
      count++;
    }
  }
  return count;
}

function hoursSinceLastWin() {
  current_time = Math.round(Date.now() / 1000);
  last_won_game_details = lastXGamesResults[numberOfGamesSinceLastWin()];
  last_won_game_start_time = last_won_game_details.start_time;
  last_won_game_duration = last_won_game_details.duration;
  last_won_game_end_time = last_won_game_start_time + last_won_game_duration;
  return Math.round((current_time - last_won_game_end_time) / 3600);
}

async function triggerWebhookVisit() {
  await fetch(tipWebhookSite, {mode:'no-cors'});
}

async function refreshTipCounterImage() {
  const counterImage = document.getElementById('tipcounter');
  const currentTime = new Date().getTime();

  counterImage.src = `${tipCounterImageSrc}?t=${currentTime}`;

}

/* Tipping feature */
function generateTip({ heroName = "Enchantress" }) {
  triggerWebhookVisit();
  refreshTipCounterImage();
  tipContainer.insertAdjacentHTML(
    "beforeend",
    `<div class="tip">
        <div class="tip-hero">
          <img
            src="https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/heroes/${heroName.toLowerCase()}.png"
            width="96px"
            height="54px"
            alt="Hero Portrait"
          />
          <span style="color:var(--player${
            (tipHeroIndex % 4) + 1
          }-color)">${heroName}</span>
        </div>
        <div class="tip-center">
          <div>TIPPED</div>
          <div class="tip-center-shard">
            <img
              src="assets/Shards_splash.webp"
              height="24px"
              width="24px"
              alt="Shard icon"
            />
            <span>50</span>
          </div>
        </div>
        <div class="tip-hero phone">
          <img
            src="https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/heroes/enchantress.png"
            width="96px"
            height="54px"
            alt="Shard icon"
          />
          <span>Phone</span>
        </div>
      </div>`
  );
  const tip = tipContainer.lastElementChild;
  tip.addEventListener("animationend", () => tip.remove());
}

(function initTip() {
  document.body.insertAdjacentHTML(
    "afterbegin",
    '<div class="tip-container"></div>'
  );
  tipContainer = document.querySelector(".tip-container");
})();

tipButton.addEventListener("click", () => {
  let audio = document.getElementById("audio");
  audio.play();
  generateTip({
    heroName: tipHeroes[tipHeroIndex % 4],
  });
  tipHeroIndex++;
});

function initShortAudios() {
  epheyLaughButton = document.getElementById("ephey-laugh-button");
  cryBabyButton = document.getElementById("crybaby-button");
  sorryButton = document.getElementById("sorry-button");

  epheyLaughButton.addEventListener("click", () => {
    var epheyLaughAudio = document.getElementById("epheyLaughAudio");
    epheyLaughAudio.play();
  });

  cryBabyButton.addEventListener("click", () => {
    var cryBabyAudio = document.getElementById("cryBabyAudio");
    cryBabyAudio.play();
  });

  sorryButton.addEventListener("click", () => {
    var sorryAudio = document.getElementById("sorryAudio");
    sorryAudio.play();
  });

}