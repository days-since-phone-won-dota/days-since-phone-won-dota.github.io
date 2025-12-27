const TwitchClips = {
  // Full URLs - just copy paste from browser
  clipUrls: [
    "https://www.twitch.tv/jayha1tch/clip/SoftHealthyWheelHeyGuys-wsoUkBIGEcco07Db",
    "https://www.twitch.tv/jayha1tch/clip/LittleZanyBunnySoonerLater-f_kNZWFsIWyDIPFR",
    "https://www.twitch.tv/jayha1tch/clip/AlluringDeliciousCucumberKAPOW-KdfS4C5k2xI9zKcr",
    "https://www.twitch.tv/jayha1tch/clip/YawningExquisitePenguinKappaClaus-EYrDRGfPyRXhkvzx",
    "https://www.twitch.tv/jayha1tch/clip/BreakablePeacefulCocoaPJSugar-QE3ZpSwwEdRRNb2f",
    "https://www.twitch.tv/jayha1tch/clip/FunCrypticFennelTTours-TOtHcX1C9vHbaJjf",
    "https://www.twitch.tv/jayha1tch/clip/CrowdedCutePigeonEleGiggle-iWWoC1FsdwBbDRib",
    "https://www.twitch.tv/jayha1tch/clip/TentativeFunBillCclamChamp-rfrgwHBG7FQg4ql6",
    "https://www.twitch.tv/jayha1tch/clip/RepleteStrangeBatteryBIRB-VG2n58JzNx6VHJG3",
    "https://www.twitch.tv/jayha1tch/clip/ResourcefulWimpyGerbilBleedPurple-NcDXlAsl1qC3X-x5",
    "https://www.twitch.tv/jayha1tch/clip/LachrymoseSpinelessStorkCopyThis-Stu2hcVu3ds3720V",
    "https://www.twitch.tv/jayha1tch/clip/HumbleGeniusPancakeHassanChop-bSoi7WibrIYvLP76",
  ],

  currentIndex: 0,
  parentDomain: window.location.hostname || "localhost",
  isInitialLoad: true, // Track initial load

  /**
   * Convert clip URL to embed URL
   * Input:  https://www.twitch.tv/jayha1tch/clip/SoftHealthyWheelHeyGuys-wsoUkBIGEcco07Db
   * Output: https://clips.twitch.tv/embed?clip=SoftHealthyWheelHeyGuys-wsoUkBIGEcco07Db&parent=localhost
   */
  getEmbedUrl(index) {
    const url = this.clipUrls[index];
    if (!url) return null;

    const clipId = url.split("/clip/")[1];
    return `https://clips.twitch.tv/embed?clip=${clipId}&parent=${this.parentDomain}`;
  },

  /**
   * Initialize the clips player UI
   */
  init(options = {}) {
    const {
      iframeId = "clips-iframe",
      thumbnailsId = "clips-thumbnails",
      prevBtnId = "clips-prev",
      nextBtnId = "clips-next",
    } = options;

    if (this.clipUrls.length === 0) {
      console.warn("No clips loaded");
      return;
    }

    const iframe = document.getElementById(iframeId);
    const thumbnails = document.getElementById(thumbnailsId);
    const prevBtn = document.getElementById(prevBtnId);
    const nextBtn = document.getElementById(nextBtnId);

    if (!iframe || !thumbnails) {
      console.warn("Clips player elements not found");
      return;
    }

    // Render thumbnails
    thumbnails.innerHTML = this.clipUrls
      .map(
        (_, index) => `
        <div class="clip-thumbnail ${
          index === 0 ? "active" : ""
        }" data-index="${index}">
          <div class="clip-thumbnail-fallback">${index + 1}</div>
          <div class="clip-thumbnail-overlay">
            <span class="clip-thumbnail-play">▶</span>
          </div>
        </div>
      `
      )
      .join("");

    // Load first clip (without scrolling)
    this.isInitialLoad = true;
    this.loadClip(0, iframe, thumbnails);

    // Thumbnail click handlers
    thumbnails.querySelectorAll(".clip-thumbnail").forEach((thumb) => {
      thumb.addEventListener("click", () => {
        this.isInitialLoad = false;
        this.loadClip(parseInt(thumb.dataset.index, 10), iframe, thumbnails);
      });
    });

    // Prev/Next buttons
    prevBtn?.addEventListener("click", () => {
      this.isInitialLoad = false;
      this.currentIndex =
        (this.currentIndex - 1 + this.clipUrls.length) % this.clipUrls.length;
      this.loadClip(this.currentIndex, iframe, thumbnails);
    });

    nextBtn?.addEventListener("click", () => {
      this.isInitialLoad = false;
      this.currentIndex = (this.currentIndex + 1) % this.clipUrls.length;
      this.loadClip(this.currentIndex, iframe, thumbnails);
    });

    // Keyboard navigation
    document.addEventListener("keydown", (e) => {
      const section = document.getElementById("clips");
      const rect = section?.getBoundingClientRect();
      const isInView = rect && rect.top < window.innerHeight && rect.bottom > 0;

      if (isInView && (e.key === "ArrowLeft" || e.key === "ArrowRight")) {
        this.isInitialLoad = false;
        this.currentIndex =
          e.key === "ArrowLeft"
            ? (this.currentIndex - 1 + this.clipUrls.length) %
              this.clipUrls.length
            : (this.currentIndex + 1) % this.clipUrls.length;
        this.loadClip(this.currentIndex, iframe, thumbnails);
      }
    });

    console.log(`Loaded ${this.clipUrls.length} Twitch clips`);
  },

  /**
   * Load clip and update UI
   */
  loadClip(index, iframe, thumbnails) {
    this.currentIndex = index;
    iframe.src = this.getEmbedUrl(index);

    // Update active thumbnail
    thumbnails.querySelectorAll(".clip-thumbnail").forEach((thumb, i) => {
      thumb.classList.toggle("active", i === index);
    });

    // Only scroll thumbnail into view AFTER initial load
    if (!this.isInitialLoad) {
      thumbnails.children[index]?.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "center",
      });
    }
  },
};

window.TwitchClips = TwitchClips;
