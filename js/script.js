const PHONE_PLAYER_ID = "80320987";

class DotaStatsClient {
    constructor(apiKey = null) {
        this.baseURL = 'https://api.opendota.com/api';
        this.apiKey = apiKey;
        this.lastCall = Date.now();
        this.callsPerMinute = 0;
        this.cache = new Map();
    }

    async #delayIfNecessary() {
        const now = Date.now();
        if (now - this.lastCall < 1000) { // 1 second delay
            await new Promise(resolve => setTimeout(resolve, 1000 - (now - this.lastCall)));
        }
        this.lastCall = Date.now();
        this.callsPerMinute++;
    }

    async #fetchWithRetry(url) {
        try {
            await this.#delayIfNecessary();
            const response = await fetch(`${url}${this.apiKey ? `?key=${this.apiKey}` : ''}`);
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(`API error: ${data.error || 'Unknown error'}`);
            }
            
            return data;
        } catch (error) {
            console.error('API fetch error:', error);
            throw error;
        }
    }

    async getLastWinStats(playerID) {
        try {
            // Check cache first
            const cacheKey = `lastWinStats_${playerID}`;
            if (this.cache.has(cacheKey)) {
                const cached = this.cache.get(cacheKey);
                if (Date.now() - cached.timestamp < 3600000) { // 1 hour cache
                    return cached.data;
                }
            }

            // Get recent matches
            const recentMatches = await this.#fetchWithRetry(
                `${this.baseURL}/players/${playerID}/matches?limit=100`
            );
            
            // Find most recent win
            const lastWin = recentMatches.find(match => match.radiant_win === true);
            
            if (!lastWin) {
                return {
                    daysSinceLastWin: null,
                    gamesSinceLastWin: null,
                    error: 'No wins found in recent matches'
                };
            }
            
            // Get detailed match data
            const winMatch = await this.#fetchWithRetry(
                `${this.baseURL}/matches/${lastWin.match_id}`
            );
            
            // Calculate days since last win
            const daysSinceLastWin = Math.floor(
                (Date.now() - winMatch.start_time * 1000) / (1000 * 60 * 60 * 24)
            );
            
            // Get all matches
            const allMatches = await this.#fetchWithRetry(
                `${this.baseURL}/players/${playerID}/matches`
            );
            
            // Count games since last win
            const gamesSinceLastWin = allMatches.filter(
                match => match.match_id > lastWin.match_id
            ).length;
            
            // Cache result
            this.cache.set(cacheKey, {
                timestamp: Date.now(),
                data: { daysSinceLastWin, gamesSinceLastWin }
            });
            
            return { daysSinceLastWin, gamesSinceLastWin };
        } catch (error) {
            console.error('Error getting last win stats:', error);
            throw error;
        }
    }
}