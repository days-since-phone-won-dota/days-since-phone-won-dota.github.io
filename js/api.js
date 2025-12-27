/**
 * OpenDota API Service
 * Centralized API calls for the application
 */

const API = {
  // Configuration
  accountId: "80320987",
  baseUrl: "https://api.opendota.com/api",
  cdnBase: "https://cdn.cloudflare.steamstatic.com",

  // Cached data
  cache: {
    heroes: null,
    profile: null,
    winLoss: null,
    peers: null,
    heroStats: null,
  },

  // ===== PLAYER DATA =====

  /**
   * Get player profile
   */
  async getProfile() {
    if (this.cache.profile) return this.cache.profile;

    try {
      const response = await fetch(`${this.baseUrl}/players/${this.accountId}`);
      this.cache.profile = await response.json();
      return this.cache.profile;
    } catch (error) {
      console.error("Failed to fetch profile:", error);
      return null;
    }
  },

  /**
   * Get win/loss stats
   */
  async getWinLoss() {
    if (this.cache.winLoss) return this.cache.winLoss;

    try {
      const response = await fetch(
        `${this.baseUrl}/players/${this.accountId}/wl`
      );
      this.cache.winLoss = await response.json();
      return this.cache.winLoss;
    } catch (error) {
      console.error("Failed to fetch win/loss:", error);
      return null;
    }
  },

  /**
   * Get recent matches
   * @param {number} limit - Number of matches to fetch
   */
  async getRecentMatches(limit = 20) {
    try {
      const response = await fetch(
        `${this.baseUrl}/players/${this.accountId}/matches?limit=${limit}`
      );
      return await response.json();
    } catch (error) {
      console.error("Failed to fetch recent matches:", error);
      return [];
    }
  },

  /**
   * Get peers (friends played with) - all time
   */
  async getPeersAllTime() {
    try {
      const response = await fetch(
        `${this.baseUrl}/players/${this.accountId}/peers`
      );
      return await response.json();
    } catch (error) {
      console.error("Failed to fetch all-time peers:", error);
      return [];
    }
  },

  /**
   * Get peers (friends played with) - limited matches
   * @param {number} limit - Number of recent matches to check
   */
  async getPeersRecent(limit = 200) {
    try {
      const response = await fetch(
        `${this.baseUrl}/players/${this.accountId}/peers?limit=${limit}`
      );
      return await response.json();
    } catch (error) {
      console.error("Failed to fetch recent peers:", error);
      return [];
    }
  },

  /**
   * Get hero stats for player
   */
  async getHeroStats() {
    if (this.cache.heroStats) return this.cache.heroStats;

    try {
      const response = await fetch(
        `${this.baseUrl}/players/${this.accountId}/heroes`
      );
      this.cache.heroStats = await response.json();
      return this.cache.heroStats;
    } catch (error) {
      console.error("Failed to fetch hero stats:", error);
      return [];
    }
  },

  // ===== HEROES DATA =====

  /**
   * Get all heroes constants
   */
  async getHeroes() {
    if (this.cache.heroes) return this.cache.heroes;

    try {
      const response = await fetch(`${this.baseUrl}/constants/heroes`);
      this.cache.heroes = await response.json();
      return this.cache.heroes;
    } catch (error) {
      console.error("Failed to fetch heroes:", error);
      return null;
    }
  },

  /**
   * Get hero name by ID
   * @param {number} heroId
   */
  getHeroName(heroId) {
    if (!this.cache.heroes || !this.cache.heroes[heroId]) return "Unknown Hero";
    return this.cache.heroes[heroId].localized_name;
  },

  /**
   * Get hero image URL by ID
   * @param {number} heroId
   */
  getHeroImageUrl(heroId) {
    if (!this.cache.heroes || !this.cache.heroes[heroId]) return null;
    return `${this.cdnBase}${this.cache.heroes[heroId].img}`;
  },

  /**
   * Get hero icon URL by ID
   * @param {number} heroId
   */
  getHeroIconUrl(heroId) {
    if (!this.cache.heroes || !this.cache.heroes[heroId]) return null;
    return `${this.cdnBase}${this.cache.heroes[heroId].icon}`;
  },

  // ===== COMBINED DATA =====

  /**
   * Get worst heroes (for bans section)
   * @param {number} minGames - Minimum games required
   * @param {number} limit - Number of heroes to return
   */
  async getWorstHeroes(minGames = 50, limit = 5) {
    await this.getHeroes(); // Ensure heroes are loaded
    const heroStats = await this.getHeroStats();

    return heroStats
      .filter((h) => h.games > minGames)
      .map((h) => ({
        heroId: h.hero_id,
        name: this.getHeroName(h.hero_id),
        image: this.getHeroImageUrl(h.hero_id),
        icon: this.getHeroIconUrl(h.hero_id),
        games: h.games,
        wins: h.win,
        winrate: ((h.win / h.games) * 100).toFixed(1),
      }))
      .sort((a, b) => parseFloat(a.winrate) - parseFloat(b.winrate))
      .slice(0, limit);
  },

  /**
   * Get worst heroes from recent matches
   * @param {number} matchLimit - Number of recent matches to analyze
   * @param {number} minGames - Minimum games required per hero
   * @param {number} heroLimit - Number of heroes to return
   */
  async getRecentWorstHeroes(matchLimit = 100, minGames = 3, heroLimit = 5) {
    await this.getHeroes(); // Ensure heroes are loaded
    const matches = await this.getRecentMatches(matchLimit);

    // Aggregate hero stats
    const heroStatsMap = {};

    matches.forEach((match) => {
      const heroId = match.hero_id;
      const isWin = this.isMatchWon(match);

      if (!heroStatsMap[heroId]) {
        heroStatsMap[heroId] = { heroId, games: 0, wins: 0 };
      }

      heroStatsMap[heroId].games++;
      if (isWin) {
        heroStatsMap[heroId].wins++;
      }
    });

    return Object.values(heroStatsMap)
      .filter((h) => h.games >= minGames)
      .map((h) => ({
        heroId: h.heroId,
        name: this.getHeroName(h.heroId),
        image: this.getHeroImageUrl(h.heroId),
        icon: this.getHeroIconUrl(h.heroId),
        games: h.games,
        wins: h.wins,
        winrate: ((h.wins / h.games) * 100).toFixed(1),
      }))
      .sort((a, b) => parseFloat(a.winrate) - parseFloat(b.winrate))
      .slice(0, heroLimit);
  },

  // ===== UTILITIES =====

  /**
   * Check if a match was won
   * @param {object} match - Match object from API
   */
  isMatchWon(match) {
    const isRadiant = match.player_slot < 128;
    return isRadiant ? match.radiant_win : !match.radiant_win;
  },

  /**
   * Calculate days since last win
   * @param {array} matches - Array of recent matches
   */
  getDaysSinceLastWin(matches) {
    if (!matches || matches.length === 0) return 0;

    for (const match of matches) {
      if (this.isMatchWon(match)) {
        const matchDate = new Date(match.start_time * 1000);
        const today = new Date();
        const diffTime = Math.abs(today - matchDate);
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      }
    }

    return 0;
  },

  /**
   * Clear all cached data
   */
  clearCache() {
    this.cache = {
      heroes: null,
      profile: null,
      winLoss: null,
      peers: null,
      heroStats: null,
    };
  },
};

// Make available globally
window.API = API;
