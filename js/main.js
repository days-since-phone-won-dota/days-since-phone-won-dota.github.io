// ===== CONFIGURATION =====
const CONFIG = {
  parentDomain: window.location.hostname || "localhost",
};

// ===== DATA STORES =====
const AppData = {
  statistics: null,
  friends: null,
  recentMatches: null,
};

// ===== INITIALIZATION =====
document.addEventListener("DOMContentLoaded", () => {
  // Initialize party invitation FIRST
  initPartyInvitation();

  // Wait a bit for script.js to initialize, then load the rest
  setTimeout(initApp, 100);
});

async function initApp() {
  showLoadingStates();

  await API.getHeroes();

  await loadStatistics();
  await loadRecentMatches();
  await loadFriendsData();
  await loadHeroBans();

  // Use Testimonials module
  await Testimonials.init("testimonials-carousel");

  if (window.TwitchClips) {
    TwitchClips.init({
      iframeId: "clips-iframe",
      prevBtnId: "clips-prev",
      nextBtnId: "clips-next",
      counterId: "clips-counter",
    });
  }
  renderAudioClips();

  initTipButton();

  initThemeToggle();

  initMobileMenu();

  animateDaysCounter();

  // Hide the Pengubear loader once everything is ready
  hidePengubearLoader();
}

// ===== PENGUBEAR LOADER =====
function hidePengubearLoader() {
  const loader = document.getElementById("pengubear-loader");
  if (loader) {
    // Add a small delay for smooth transition
    setTimeout(() => {
      loader.classList.add("hidden");
    }, 300);
  }
}

function showPengubearLoader() {
  const loader = document.getElementById("pengubear-loader");
  if (loader) {
    loader.classList.remove("hidden");
  }
}

// ===== LOADING STATES =====
function showLoadingStates() {
  const grids = [
    "kda-grid",
    "rank-grid",
    "stats-grid",
    "friends-grid",
    "recent-bans-grid",
    "bans-grid",
  ];
  grids.forEach((gridId) => {
    const grid = document.getElementById(gridId);
    if (grid) {
      grid.innerHTML = generateSkeletons(4);
    }
  });
}

function generateSkeletons(count) {
  return Array(count)
    .fill(0)
    .map(() => `<div class="skeleton" style="height: 150px;"></div>`)
    .join("");
}

// ===== DAYS COUNTER ANIMATION =====
function animateDaysCounter() {
  const counter = document.getElementById("days-counter");
  if (!counter) return;

  const targetDays = calculateDaysSinceLastWin();
  let currentDays = 0;
  const duration = 1500;
  const increment = targetDays / (duration / 16);

  const animate = () => {
    currentDays += increment;
    if (currentDays >= targetDays) {
      counter.textContent = targetDays;
    } else {
      counter.textContent = Math.floor(currentDays);
      requestAnimationFrame(animate);
    }
  };

  requestAnimationFrame(animate);
}

function calculateDaysSinceLastWin() {
  if (AppData.recentMatches && AppData.recentMatches.length) {
    return API.getDaysSinceLastWin(AppData.recentMatches);
  }

  return 0;
}

// ===== RECENT MATCHES =====
async function loadRecentMatches() {
  try {
    AppData.recentMatches = await API.getRecentMatches(20);
    renderRecentMatches();
  } catch (error) {
    console.error("Failed to load recent matches:", error);
    AppData.recentMatches = [];
  }
}

function renderRecentMatches() {
  const kdaGrid = document.getElementById("kda-grid");
  const recentMatches = AppData.recentMatches;

  let kills = 0;
  let deaths = 0;
  let assists = 0;

  recentMatches.forEach((match) => {
    kills += match.kills || 0;
    deaths += match.deaths || 0;
    assists += match.assists || 0;
  });

  const recentKdaDataList = [
    {
      icon: "⚔️",
      value: `${kills}`,
      label: "Kills",
      subtext: "Moments of glory (however brief)",
    },
    {
      icon: "💀",
      value: `${deaths}`,
      label: "Deaths",
      subtext: "A true connoisseur of respawn timers",
    },
    {
      icon: "🤝",
      value: `${assists}`,
      label: "Assists",
      subtext: "Helping others pad their stats",
    },
  ];
  kdaGrid.innerHTML = recentKdaDataList
    .map(
      (recentKdaData) => `
        <div class="stat-card">
          <div class="stat-icon">${
            recentKdaData.customIcon || recentKdaData.icon
          }</div>
          <div class="stat-value">${recentKdaData.value}</div>
          <div class="stat-label">${recentKdaData.label}</div>
          <div class="stat-subtext">${recentKdaData.subtext}</div>
        </div>
      `
    )
    .join("");
}

// ===== STATISTICS SECTION =====
async function loadStatistics() {
  try {
    const profileData = await API.getProfile();
    const wlData = await API.getWinLoss();

    AppData.statistics = { ...profileData, ...wlData };
    renderStatistics();
  } catch (error) {
    console.error("Failed to load statistics:", error);
    renderStatisticsError();
  }
}

function renderStatistics() {
  const rankGrid = document.getElementById("rank-grid");
  const statsGrid = document.getElementById("stats-grid");
  if (!rankGrid || !statsGrid || !AppData.statistics) return;

  const stats = AppData.statistics;

  // Generate rank medal HTML
  const rankDisplay = getRankDisplay(stats.rank_tier);
  const rankData = {
    customIcon: rankDisplay.html,
    value: rankDisplay.name,
    label: "Current Rank",
    subtext: "Peak: Still searching",
  };
  rankGrid.innerHTML = `
        <div class="stat-card">
          <div class="stat-icon">${rankData.customIcon || rankData.icon}</div>
          <div class="stat-value">${rankData.value}</div>
          <div class="stat-label">${rankData.label}</div>
          <div class="stat-subtext">${rankData.subtext}</div>
        </div>
      `;

  // Generate Overall Stats HTML
  const winRate =
    stats.win && stats.lose
      ? ((stats.win / (stats.win + stats.lose)) * 100).toFixed(1)
      : "0.0";

  const totalGames = (stats.win || 0) + (stats.lose || 0);

  const statsData = [
    {
      icon: "🎯",
      value: `${winRate}%`,
      label: "Win Rate",
      subtext:
        parseFloat(winRate) < 50 ? "Room for improvement" : "Suspicious...",
    },
    {
      icon: "🎮",
      value: totalGames.toLocaleString(),
      label: "Total Games",
      subtext: "Hours that could have been productive",
    },
    {
      icon: "✅",
      value: stats.win?.toLocaleString() || "0",
      label: "Wins",
      subtext: "Carried by teammates",
    },
    {
      icon: "❌",
      value: stats.lose?.toLocaleString() || "0",
      label: "Losses",
      subtext: "Personal responsibility",
    },
  ];

  statsGrid.innerHTML = statsData
    .map(
      (stat) => `
        <div class="stat-card">
          <div class="stat-icon">${stat.customIcon || stat.icon}</div>
          <div class="stat-value">${stat.value}</div>
          <div class="stat-label">${stat.label}</div>
          <div class="stat-subtext">${stat.subtext}</div>
        </div>
      `
    )
    .join("");
}

/**
 * Get rank display with medal images
 * @param {number} rankTier - Two digit rank tier (e.g., 42 = Archon 2)
 * @returns {object} - { html: string, name: string }
 */
function getRankDisplay(rankTier) {
  const ranks = [
    "",
    "Herald",
    "Guardian",
    "Crusader",
    "Archon",
    "Legend",
    "Ancient",
    "Divine",
    "Immortal",
  ];

  if (!rankTier) {
    return {
      html: `<div class="rank-medal"><span class="rank-medal-unranked">?</span></div>`,
      name: "Unranked",
    };
  }

  const tier = Math.floor(rankTier / 10);
  const stars = rankTier % 10;
  const rankName = `${ranks[tier] || "Unknown"} ${stars}`;

  const baseUrl = "https://www.opendota.com/assets/images/dota2/rank_icons";

  // Immortal (tier 8) has special handling
  if (tier === 8) {
    return {
      html: `
        <div class="rank-medal" data-rank="${rankName}">
          <img 
            class="rank-medal-icon" 
            src="${baseUrl}/rank_icon_8.png" 
            alt="${rankName}"
            onerror="this.parentElement.innerHTML='🏆'"
          >
        </div>
      `,
      name: rankName,
    };
  }

  return {
    html: `
      <div class="rank-medal" data-rank="${rankName}">
        <img 
          class="rank-medal-icon" 
          src="${baseUrl}/rank_icon_${tier}.png" 
          alt="${rankName}"
          onerror="this.parentElement.innerHTML='🏆'"
        >
        ${
          stars > 0
            ? `<img 
                class="rank-medal-star" 
                src="${baseUrl}/rank_star_${stars}.png" 
                alt="${stars} stars"
                onerror="this.style.display='none'"
              >`
            : ""
        }
      </div>
    `,
    name: rankName,
  };
}

function renderStatisticsError() {
  const grid = document.getElementById("stats-grid");
  if (!grid) return;

  grid.innerHTML = `
        <div class="stat-card" style="grid-column: 1 / -1;">
            <div class="stat-icon">😅</div>
            <div class="stat-value">Oops</div>
            <div class="stat-label">Failed to load stats</div>
            <div class="stat-subtext">The API is as reliable as Phone's gameplay</div>
        </div>
    `;
}

// ===== FRIENDS / WIN RATE SECTION =====
async function loadFriendsData() {
  const allTimeContainer = document.getElementById("friends-grid-alltime");
  const recentContainer = document.getElementById("friends-grid-recent");

  // Load all-time friends
  if (allTimeContainer) {
    await loadAllTimeFriends(allTimeContainer);
  }

  // Load recent friends
  if (recentContainer) {
    await loadRecentFriends(recentContainer);
  }
}

/**
 * Load all-time friends stats
 */
async function loadAllTimeFriends(container) {
  try {
    const data = await API.getPeersAllTime();

    // Sort by games played, take top 8
    const friends = data
      .filter((f) => f.games >= 10)
      .sort((a, b) => b.games - a.games)
      .slice(0, 8);

    if (friends.length === 0) {
      container.innerHTML = '<p class="error">No friends data available</p>';
      return;
    }

    container.innerHTML = renderFriendCards(friends, [
      "Ride or die",
      "Veteran teammate",
      "Old reliable",
      "OG squad member",
      "Day one homie",
      "Battle buddy",
      "War companion",
      "Trench partner",
    ]);
  } catch (error) {
    console.error("Failed to load all-time friends:", error);
    container.innerHTML = '<p class="error">Failed to load friends data</p>';
  }
}

/**
 * Load recent friends stats (last 200 matches)
 */
async function loadRecentFriends(container) {
  try {
    const data = await API.getPeersRecent(200);

    // Sort by games played, take top 8
    const friends = data
      .filter((f) => f.games >= 5)
      .sort((a, b) => b.games - a.games)
      .slice(0, 8);

    if (friends.length === 0) {
      container.innerHTML = `
        <div class="friend-card" style="grid-column: 1 / -1; text-align: center;">
          <div class="friend-avatar">🎮</div>
          <div class="friend-info">
            <div class="friend-name">Solo Queue Enjoyer</div>
            <div class="friend-stats">No recent party games found</div>
          </div>
        </div>
      `;
      return;
    }

    container.innerHTML = renderFriendCards(friends, [
      "Current carry",
      "Active teammate",
      "Recent recruit",
      "New blood",
      "Fresh face",
      "Party regular",
      "Queue buddy",
      "Stack member",
    ]);
  } catch (error) {
    console.error("Failed to load recent friends:", error);
    container.innerHTML = '<p class="error">Failed to load friends data</p>';
  }
}

/**
 * Render friend cards with custom subtitles
 */
function renderFriendCards(friends, subtitles) {
  return friends
    .map((friend, index) => {
      const winrate = ((friend.win / friend.games) * 100).toFixed(1);
      const isPositive = parseFloat(winrate) >= 50;
      const initial = friend.personaname
        ? friend.personaname.charAt(0).toUpperCase()
        : "?";

      return `
        <div class="friend-card">
          <div class="friend-avatar">
            ${
              friend.avatarfull
                ? `<img src="${friend.avatarfull}" alt="${
                    friend.personaname || "Player"
                  }" onerror="this.style.display='none'; this.parentElement.textContent='${initial}';">`
                : initial
            }
          </div>
          <div class="friend-info">
            <div class="friend-name">${
              friend.personaname || "Unknown Player"
            }</div>
            <div class="friend-stats">
              ${friend.games} games • ${subtitles[index] || "Teammate"}
            </div>
          </div>
          <div class="friend-winrate ${isPositive ? "positive" : "negative"}">
            ${winrate}%
          </div>
        </div>
      `;
    })
    .join("");
}

// ===== HERO BANS SECTION =====
async function loadHeroBans() {
  const container = document.getElementById("bans-grid");
  const recentContainer = document.getElementById("recent-bans-grid");

  // Load all-time bans
  if (container) {
    await loadAllTimeBans(container);
  }

  // Load recent bans
  if (recentContainer) {
    await loadRecentBans(recentContainer);
  }
}

/**
 * Load all-time worst heroes (50+ games)
 */
async function loadAllTimeBans(container) {
  try {
    const bans = await API.getWorstHeroes(50, 5);

    container.innerHTML = renderBanCards(bans, [
      "Certified feeder",
      "Auto-loss",
      "Avoid at all costs",
      "Team morale destroyer",
      "MMR assassin",
    ]);
  } catch (error) {
    console.error("Failed to load all-time hero bans:", error);
    container.innerHTML = '<p class="error">Failed to load hero bans</p>';
  }
}

/**
 * Load recent worst heroes (last 100 games)
 */
async function loadRecentBans(container) {
  try {
    const recentBans = await API.getRecentWorstHeroes(100, 3, 5);

    if (recentBans.length === 0) {
      container.innerHTML = `
        <div class="ban-card" style="grid-column: 1 / -1; text-align: center;">
          <div class="ban-hero-image">🎉</div>
          <div class="ban-hero-name">No Recent Disasters!</div>
          <div class="ban-reason">Either improving or not enough data</div>
        </div>
      `;
      return;
    }

    container.innerHTML = renderBanCards(recentBans, [
      "Currently cursed",
      "On a losing streak",
      "Skill issue detected",
      "Patch victim",
      "Hopeless cause",
    ]);
  } catch (error) {
    console.error("Failed to load recent hero bans:", error);
    container.innerHTML = '<p class="error">Failed to load recent bans</p>';
  }
}

/**
 * Render ban cards with custom subtitles
 */
function renderBanCards(bans, subtitles) {
  return bans
    .map(
      (hero, index) => `
      <div class="ban-card">
        <div class="ban-hero-image">
          ${
            hero.image
              ? `<img src="${hero.image}" alt="${hero.name}" onerror="this.parentElement.innerHTML='🦸'">`
              : "🦸"
          }
        </div>
        <div class="ban-hero-name">${hero.name}</div>
        <div class="ban-stats">${hero.wins}W - ${hero.games - hero.wins}L</div>
        <div class="ban-winrate">${hero.winrate}%</div>
        <div class="ban-reason">${subtitles[index] || "Questionable pick"}</div>
      </div>
    `
    )
    .join("");
}

// ===== AUDIO CLIPS SECTION =====
function renderAudioClips() {
  const grid = document.getElementById("audio-grid");
  if (!grid || !window.AudioClips) return;

  grid.innerHTML = AudioClips.clips
    .map(
      (clip) => `
      <div class="audio-card" data-clip-id="${clip.id}">
        <div class="audio-icon">${clip.icon}</div>
        <div class="audio-title">${clip.title}</div>
      </div>
    `
    )
    .join("");

  // Add click handlers
  grid.querySelectorAll(".audio-card").forEach((card) => {
    card.addEventListener("click", () => {
      AudioClips.toggle(card.dataset.clipId, card);
    });
  });
}

// ===== TIP BUTTON & MODAL =====
let tipContainer;
let tipHeroIndex = 0;
const tipHeroes = ["Pudge", "Hoodwink", "Oracle", "Necrolyte"];
const tipWebhookSite =
  "https://www.freevisitorcounters.com/en/home/counter/1323914/t/13";
const tipCounterImageSrc =
  "https://www.freevisitorcounters.com/en/counter/render/1323914/t/13";

// Player colors matching Dota 2
const playerColors = {
  1: "#3375ff", // Blue
  2: "#66ffbf", // Teal
  3: "#bf00bf", // Purple
  4: "#f3f00b", // Yellow
  5: "#ff6b00", // Orange
};

async function triggerWebhookVisit() {
  try {
    await fetch(tipWebhookSite, { mode: "no-cors" });
  } catch (error) {
    console.log("Webhook visit triggered");
  }
}

function refreshTipCounterImage() {
  const counterImage = document.getElementById("tipcounter");
  if (counterImage) {
    const currentTime = new Date().getTime();
    counterImage.src = `${tipCounterImageSrc}?t=${currentTime}`;
  }
}

function generateTip({ heroName = "Enchantress" }) {
  triggerWebhookVisit();
  refreshTipCounterImage();

  const playerColorIndex = (tipHeroIndex % 4) + 1;
  const playerColor = playerColors[playerColorIndex];

  tipContainer.insertAdjacentHTML(
    "beforeend",
    `<div class="tip">
      <div class="tip-hero">
        <img
          src="https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/heroes/${heroName.toLowerCase()}.png"
          width="96px"
          height="54px"
          alt="${heroName}"
        />
        <span style="color: ${playerColor}">${heroName}</span>
      </div>
      <div class="tip-center">
        <div>TIPPED</div>
        <div class="tip-center-shard">
          <img
            src="assets/images/Shards_splash.webp"
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
          alt="Phone"
        />
        <span>Phone</span>
      </div>
    </div>`
  );

  const tip = tipContainer.lastElementChild;
  tip.addEventListener("animationend", () => tip.remove());
}

function initTipContainer() {
  // Create tip container if it doesn't exist
  if (!document.querySelector(".tip-container")) {
    document.body.insertAdjacentHTML(
      "afterbegin",
      '<div class="tip-container" id="tip-container"></div>'
    );
  }
  tipContainer = document.querySelector(".tip-container");
}

function initTipButton() {
  const tipButton = document.getElementById("tip-button");
  if (!tipButton) return;

  // Initialize tip container
  initTipContainer();

  tipButton.addEventListener("click", () => {
    // Play tip audio
    const audio = document.getElementById("tip-audio");
    if (audio) {
      audio.currentTime = 0;
      audio.play().catch(() => {});
    }

    // Generate tip notification
    generateTip({
      heroName: tipHeroes[tipHeroIndex % tipHeroes.length],
    });

    tipHeroIndex++;
  });
}

// ===== THEME TOGGLE =====
function initThemeToggle() {
  const toggle = document.getElementById("theme-toggle");
  if (!toggle) return;

  // Check for saved preference or system preference
  const savedTheme = localStorage.getItem("theme");
  const systemPrefersDark = window.matchMedia(
    "(prefers-color-scheme: dark)"
  ).matches;

  // Set initial theme
  if (savedTheme) {
    console.log(savedTheme);

    document.documentElement.setAttribute("data-theme", savedTheme);
  } else if (!systemPrefersDark) {
    document.documentElement.setAttribute("data-theme", "light");
  }
  // Default is dark (no attribute needed since CSS defaults to dark)

  // Toggle handler
  toggle.addEventListener("click", () => {
    const currentTheme = document.documentElement.getAttribute("data-theme");
    const newTheme = currentTheme === "light" ? "dark" : "light";

    if (newTheme === "dark") {
      document.documentElement.removeAttribute("data-theme");
    } else {
      document.documentElement.setAttribute("data-theme", "light");
    }

    localStorage.setItem("theme", newTheme);
  });

  // Listen for system preference changes
  window
    .matchMedia("(prefers-color-scheme: dark)")
    .addEventListener("change", (e) => {
      if (!localStorage.getItem("theme")) {
        if (e.matches) {
          document.documentElement.removeAttribute("data-theme");
        } else {
          document.documentElement.setAttribute("data-theme", "light");
        }
      }
    });
}

// ===== MOBILE MENU =====
function initMobileMenu() {
  const menuToggle = document.getElementById("mobile-menu-toggle");
  const mobileMenu = document.getElementById("mobile-nav-menu");
  const mobileOverlay = document.getElementById("mobile-nav-overlay");
  const mobileNavLinks = document.querySelectorAll(".mobile-nav-link");

  if (!menuToggle || !mobileMenu || !mobileOverlay) return;

  function openMenu() {
    menuToggle.classList.add("active");
    mobileMenu.classList.add("active");
    mobileOverlay.classList.add("active");
    document.body.style.overflow = "hidden";
  }

  function closeMenu() {
    menuToggle.classList.remove("active");
    mobileMenu.classList.remove("active");
    mobileOverlay.classList.remove("active");
    document.body.style.overflow = "";
  }

  function toggleMenu() {
    const isOpen = menuToggle.classList.contains("active");
    if (isOpen) {
      closeMenu();
    } else {
      openMenu();
    }
  }

  // Toggle menu on button click
  menuToggle.addEventListener("click", toggleMenu);

  // Close menu when clicking overlay
  mobileOverlay.addEventListener("click", closeMenu);

  // Close menu when clicking a nav link
  mobileNavLinks.forEach((link) => {
    link.addEventListener("click", closeMenu);
  });

  // Close menu on window resize if screen becomes larger
  window.addEventListener("resize", () => {
    if (window.innerWidth > 768) {
      closeMenu();
    }
  });

  // Close menu on escape key
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && menuToggle.classList.contains("active")) {
      closeMenu();
    }
  });
}

// ===== PARTY INVITATION =====
function initPartyInvitation() {
  const overlay = document.getElementById("party-invitation");
  const acceptBtn = document.getElementById("party-accept");
  const declineBtn = document.getElementById("party-decline");
  const inviteSound = document.getElementById("party-invitation-sound");
  const clickSound = document.getElementById("button-click-sound");

  if (!overlay || !acceptBtn || !declineBtn) return;

  // Always show invitation on page load
  document.body.classList.add("invitation-pending");
  overlay.classList.remove("hidden");

  // Play invitation sound on load
  if (inviteSound) {
    inviteSound.volume = 0.5;

    const playPromise = inviteSound.play();

    if (playPromise !== undefined) {
      playPromise.catch((error) => {
        console.log("Autoplay blocked - adding click listener to overlay");

        const playOnClick = () => {
          inviteSound.play().catch(() => {});
          overlay.removeEventListener("click", playOnClick);
        };

        overlay.addEventListener("click", playOnClick);
      });
    }
  }

  // Accept button - play click sound and show the page
  acceptBtn.addEventListener("click", (e) => {
    e.stopPropagation();

    // Play click sound
    if (clickSound) {
      clickSound.volume = 0.5;
      clickSound.currentTime = 0;
      clickSound.play().catch(() => {});
    }

    // Stop invitation sound
    if (inviteSound) {
      inviteSound.pause();
      inviteSound.currentTime = 0;
    }

    // Small delay to let click sound play before hiding
    setTimeout(() => {
      overlay.classList.add("hidden");
      document.body.classList.remove("invitation-pending");
    }, 100);
  });

  // Decline button - play click sound and close the tab
  declineBtn.addEventListener("click", (e) => {
    e.stopPropagation();

    // Play click sound
    if (clickSound) {
      clickSound.volume = 0.5;
      clickSound.currentTime = 0;
      clickSound.play().catch(() => {});
    }

    // Stop invitation sound
    if (inviteSound) {
      inviteSound.pause();
      inviteSound.currentTime = 0;
    }

    // Small delay to let click sound play before closing
    setTimeout(() => {
      window.close();

      setTimeout(() => {
        window.location.href = "https://www.google.com";
      }, 100);
    }, 150);
  });
}
