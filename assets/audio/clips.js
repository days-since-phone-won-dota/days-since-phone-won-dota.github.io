// assets/audio/clips.js
const AudioClips = {
  clips: [
    {
      id: "ephey-laugh",
      src: "assets/audio/ephey_laugh.mp3",
      title: "Ephey Laugh",
      icon: "😂",
    },
    {
      id: "crybaby",
      src: "assets/audio/phone_crying.mp3",
      title: "Cry Baby",
      icon: "😭",
    },
    {
      id: "sorry",
      src: "assets/audio/phone_sorry.mp3",
      title: "Sorry",
      icon: "😅",
    },
    {
      id: "bobian",
      src: "assets/audio/bobian.mp3",
      title: "Bobian",
      icon: "🤪",
    },
    {
      id: "yawning",
      src: "assets/audio/yawning.mp3",
      title: "Yawning",
      icon: "🥱",
    },
    {
      id: "in-picture",
      src: "assets/audio/im_in_the_picture.mp3",
      title: "I'm in Picture",
      icon: "📸",
    },
  ],

  currentAudio: null,
  currentCard: null,

  play(id, card) {
    this.stop();

    const clip = this.clips.find((c) => c.id === id);
    if (!clip) return;

    this.currentAudio = new Audio(clip.src);
    this.currentCard = card;

    if (card) card.classList.add("playing");

    this.currentAudio.play().catch((e) => console.error("Audio failed:", e));
    this.currentAudio.addEventListener("ended", () => this.stop());
  },

  stop() {
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio.currentTime = 0;
      this.currentAudio = null;
    }
    if (this.currentCard) {
      this.currentCard.classList.remove("playing");
      this.currentCard = null;
    }
  },

  toggle(id, card) {
    if (this.currentCard === card && this.currentAudio) {
      this.stop();
    } else {
      this.play(id, card);
    }
  },
};

window.AudioClips = AudioClips;

// Example usage - attach to any elements with .play-clip class
document.addEventListener("DOMContentLoaded", () => {
  const playButtons = document.querySelectorAll(".play-clip");
  playButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const clipId = button.getAttribute("data-clip-id");
      AudioClips.toggle(clipId, button);
    });
  });
});
