/**
 * Testimonials Module
 * Renders testimonials using real friends data from API
 */

const Testimonials = {
  // Humorous quotes paired with roles
  quotes: [
    {
      quote:
        "Playing with Phone is like a box of chocolates - you never know what you're gonna get, but it's usually a loss.",
      role: "Chocolate Enthusiast",
    },
    {
      quote:
        "I've seen things... terrible things. Phone diving into 5 people alone. I still have nightmares.",
      role: "Trauma Survivor",
    },
    {
      quote: "Phone once said 'trust me'. I trusted. Now I have trust issues.",
      role: "Therapy Patient",
    },
    {
      quote:
        "The only consistent thing about Phone is the inconsistency. And the feeding. That's pretty consistent too.",
      role: "Statistical Analyst",
    },
    {
      quote:
        "I've never seen someone die to neutrals so creatively. Truly an artist.",
      role: "Art Critic",
    },
    {
      quote:
        "Phone's game sense is like a broken clock - right twice a day, wrong the other 98% of the time.",
      role: "Optimist",
    },
  ],

  // Fallback data if API fails
  fallbackPersonas: [
    { name: "Anonymous Teammate", avatar: "🎮" },
    { name: "Random Pub Player", avatar: "🎲" },
    { name: "Frustrated Support", avatar: "💔" },
  ],

  /**
   * Initialize and render testimonials
   * @param {string} containerId - ID of the container element
   */
  async init(containerId = "testimonials-carousel") {
    const container = document.getElementById(containerId);
    if (!container) return;

    try {
      const data = await API.getPeersRecent(200);

      const topFriends = data
        .filter((f) => f.games >= 5 && f.personaname)
        .sort((a, b) => b.games - a.games)
        .slice(0, 6);

      if (topFriends.length === 0) {
        container.innerHTML = this.renderFallback();
        return;
      }

      container.innerHTML = this.renderCards(topFriends);
    } catch (error) {
      console.error("Failed to load testimonials:", error);
      container.innerHTML = this.renderFallback();
    }
  },

  /**
   * Render testimonial cards with real friends data
   * @param {Array} friends - Array of friend objects from API
   */
  renderCards(friends) {
    return friends
      .map((friend, index) => {
        const quote = this.quotes[index] || this.quotes[0];
        const winrate = ((friend.win / friend.games) * 100).toFixed(1);
        const stars = this.getStarRating(parseFloat(winrate));
        const avatarUrl = friend.avatarfull || friend.avatar || null;
        const initial = friend.personaname.charAt(0).toUpperCase();

        return `
          <div class="testimonial-card">
            <div class="testimonial-content">
              "${quote.quote}"
            </div>
            <div class="testimonial-author">
              <div class="testimonial-avatar">
                ${
                  avatarUrl
                    ? `<img src="${avatarUrl}" alt="${friend.personaname}" onerror="this.remove();">`
                    : initial
                }
              </div>
              <div class="testimonial-info">
                <div class="testimonial-name">${friend.personaname}</div>
                <div class="testimonial-role">${quote.role} • ${
          friend.games
        } games</div>
              </div>
              <div class="testimonial-rating">${stars}</div>
            </div>
          </div>
        `;
      })
      .join("");
  },

  /**
   * Render fallback testimonials if API fails
   */
  renderFallback() {
    return this.fallbackPersonas
      .map((person, index) => {
        const quote = this.quotes[index];
        return `
          <div class="testimonial-card">
            <div class="testimonial-content">
              "${quote.quote}"
            </div>
            <div class="testimonial-author">
              <div class="testimonial-avatar">${person.avatar}</div>
              <div class="testimonial-info">
                <div class="testimonial-name">${person.name}</div>
                <div class="testimonial-role">${quote.role}</div>
              </div>
              <div class="testimonial-rating">★★☆☆☆</div>
            </div>
          </div>
        `;
      })
      .join("");
  },

  /**
   * Get star rating based on winrate
   * @param {number} winrate - Win rate percentage
   */
  getStarRating(winrate) {
    if (winrate >= 60) return "★★★★★";
    if (winrate >= 55) return "★★★★☆";
    if (winrate >= 50) return "★★★☆☆";
    if (winrate >= 45) return "★★☆☆☆";
    return "★☆☆☆☆";
  },
};

window.Testimonials = Testimonials;
