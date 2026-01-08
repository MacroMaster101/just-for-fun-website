// ===== LOADING SCREEN =====

// Hide loading screen when page is ready
function hideLoadingScreen() {
  const loadingScreen = document.querySelector('.loading-screen');
  if (loadingScreen) {
    loadingScreen.classList.add('fade-out');
    
    // Remove from DOM after fade out
    setTimeout(() => {
      loadingScreen.style.display = 'none';
    }, 500);
  }
}

// Use multiple events to ensure it hides
if (document.readyState === 'complete') {
  // Page already loaded - wait minimum 2 seconds for better UX
  setTimeout(hideLoadingScreen, 2000);
} else {
  // Wait for page to load with minimum display time
  window.addEventListener('load', () => {
    setTimeout(hideLoadingScreen, 2000);
  });
  
  // Fallback: hide after max 5 seconds regardless
  setTimeout(hideLoadingScreen, 5000);
}

// ===== BASIC SITE SCRIPTS =====

// Set current year in footer
const yearSpan = document.getElementById("year");
if (yearSpan) {
  yearSpan.textContent = new Date().getFullYear();
}

// Simple scroll-in animation using IntersectionObserver
const observedBlocks = document.querySelectorAll(".section, .hero");

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("in-view");
        observer.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.18 }
);

observedBlocks.forEach((el) => observer.observe(el));

// ===== YOUTUBE API CONFIG =====

// NOTE: make sure you restricted this key in Google Cloud
const API_KEY = "AIzaSyAZ1Z_JmzSKeeWFys9FfJdXCj4OdZSsiTs";
const CHANNEL_ID = "UCcCp0B0bypJE4EJjwq8u2lQ";

const videoContainer = document.getElementById("yt-videos");
const errorMessage = document.getElementById("yt-error");

// Elements for Next Stream card
const streamStatusEl = document.getElementById("stream-status");
const streamTitleEl = document.getElementById("stream-title");
const streamTimeEl = document.getElementById("stream-time");
const streamNoteEl = document.getElementById("stream-note");

// ---- Load Channel Statistics ----
async function loadChannelStats() {
  try {
    const url =
      `https://www.googleapis.com/youtube/v3/channels` +
      `?key=${API_KEY}` +
      `&id=${CHANNEL_ID}` +
      `&part=statistics,snippet,brandingSettings`;

    const res = await fetch(url);
    const data = await res.json();

    if (data.items && data.items.length > 0) {
      const channel = data.items[0];
      const stats = channel.statistics;
      const snippet = channel.snippet;

      // Update stat values if elements exist
      const subCountEl = document.querySelector('[data-stat="subscribers"]');
      const videoCountEl = document.querySelector('[data-stat="videos"]');
      const viewCountEl = document.querySelector('[data-stat="views"]');

      if (subCountEl && stats.subscriberCount) {
        const subs = parseInt(stats.subscriberCount);
        subCountEl.textContent = subs >= 1000 ? `${Math.floor(subs / 1000)}K+` : subs;
      }

      if (videoCountEl && stats.videoCount) {
        videoCountEl.textContent = stats.videoCount;
      }

      if (viewCountEl && stats.viewCount) {
        const views = parseInt(stats.viewCount);
        viewCountEl.textContent = views >= 1000000 
          ? `${(views / 1000000).toFixed(1)}M` 
          : views >= 1000 
          ? `${Math.floor(views / 1000)}K` 
          : views;
      }

      // Update channel description if exists
      const heroSubtitle = document.querySelector('.hero-subtitle');
      if (heroSubtitle && snippet.description) {
        const description = snippet.description.split('\n')[0].substring(0, 150);
        if (description) {
          heroSubtitle.innerHTML = `
            ${description}
            <span class="subtitle-highlight">Join the squad and let's dominate together!</span>
          `;
        }
      }
    } else {
      // API response but no data - use fallbacks
      setFallbackStats();
    }
  } catch (error) {
    console.log('Could not load channel stats:', error);
    // Set fallback values when API fails
    setFallbackStats();
  }
}

// Set fallback stat values
function setFallbackStats() {
  const subCountEl = document.querySelector('[data-stat="subscribers"]');
  const videoCountEl = document.querySelector('[data-stat="videos"]');
  const viewCountEl = document.querySelector('[data-stat="views"]');

  if (subCountEl) {
    subCountEl.textContent = "1K+";
  }
  if (videoCountEl) {
    videoCountEl.textContent = "50+";
  }
  if (viewCountEl) {
    viewCountEl.textContent = "10K+";
  }
}

// ---- Load latest videos ----
async function loadLatestVideos() {
  if (!videoContainer) return;

  try {
    const url =
      `https://www.googleapis.com/youtube/v3/search` +
      `?key=${API_KEY}` +
      `&channelId=${CHANNEL_ID}` +
      `&part=snippet,id` +
      `&order=date` +
      `&maxResults=6`;

    const res = await fetch(url);
    const data = await res.json();

    if (!data.items || !data.items.length) {
      if (errorMessage) {
        errorMessage.style.display = "block";
        errorMessage.textContent = "No videos found yet.";
      }
      return;
    }

    data.items.forEach((item) => {
      if (item.id.kind === "youtube#video") {
        const videoId = item.id.videoId;
        const snippet = item.snippet;
        const title = snippet.title;
        const thumbnails = snippet.thumbnails;
        const thumbUrl =
          (thumbnails.high && thumbnails.high.url) ||
          (thumbnails.medium && thumbnails.medium.url) ||
          thumbnails.default.url;

        const card = document.createElement("article");
        card.className = "video-card";

        card.innerHTML = `
          <div class="video-thumb">
            <img src="${thumbUrl}" alt="${title}">
          </div>
          <div class="video-info">
            <h3>${title}</h3>
            <a class="video-link"
               href="https://www.youtube.com/watch?v=${videoId}"
               target="_blank" rel="noopener">
              ▶ Watch on YouTube
            </a>
          </div>
        `;

        videoContainer.appendChild(card);
      }
    });
  } catch (err) {
    console.error("Error loading YouTube videos:", err);
    if (errorMessage) {
      errorMessage.style.display = "block";
      errorMessage.textContent =
        "Couldn’t load videos right now. Please try again later.";
    }
  }
}

// ---- Load upcoming / live stream for hero card ----
async function loadNextStream() {
  if (!streamStatusEl || !streamTitleEl || !streamTimeEl || !streamNoteEl) return;

  try {
    // First check if there's a LIVE stream
    let searchUrl =
      `https://www.googleapis.com/youtube/v3/search` +
      `?key=${API_KEY}` +
      `&channelId=${CHANNEL_ID}` +
      `&part=snippet,id` +
      `&type=video` +
      `&eventType=live` +
      `&order=date` +
      `&maxResults=1`;

    let res = await fetch(searchUrl);
    let data = await res.json();

    let statusLabel = "Next Stream";
    let streamItem = null;
    let isLive = false;

    if (data.items && data.items.length > 0) {
      // There is a live stream right now
      streamItem = data.items[0];
      isLive = true;
      statusLabel = "LIVE NOW";
    } else {
      // If not live, check upcoming streams
      searchUrl =
        `https://www.googleapis.com/youtube/v3/search` +
        `?key=${API_KEY}` +
        `&channelId=${CHANNEL_ID}` +
        `&part=snippet,id` +
        `&type=video` +
        `&eventType=upcoming` +
        `&order=date` +
        `&maxResults=1`;

      res = await fetch(searchUrl);
      data = await res.json();
      if (data.items && data.items.length > 0) {
        streamItem = data.items[0];
        statusLabel = "Upcoming Stream";
      }
    }

    if (!streamItem) {
      // no live or upcoming – keep default text
      streamStatusEl.textContent = "No scheduled stream";
      streamTitleEl.textContent = "Follow the channel for updates";
      streamTimeEl.textContent = "";
      streamNoteEl.textContent = "Streams usually happen on weekends. 🔔";
      return;
    }

    const videoId = streamItem.id.videoId;
    const snippet = streamItem.snippet;
    const title = snippet.title;

    streamStatusEl.textContent = statusLabel;
    streamTitleEl.textContent = title;

    // For upcoming/live start time we need another call to 'videos'
    const videosUrl =
      `https://www.googleapis.com/youtube/v3/videos` +
      `?key=${API_KEY}` +
      `&id=${videoId}` +
      `&part=liveStreamingDetails`;

    const videosRes = await fetch(videosUrl);
    const videosData = await videosRes.json();

    let startText = "";
    const videoInfo = videosData.items && videosData.items[0];
    if (videoInfo && videoInfo.liveStreamingDetails) {
      const live = videoInfo.liveStreamingDetails;
      const startTime = live.scheduledStartTime || live.actualStartTime;
      if (startTime) {
        const date = new Date(startTime);
        startText = date.toLocaleString();
      }
    }

    if (isLive) {
      streamTimeEl.textContent = startText ? `Started at ${startText}` : "Streaming now";
      streamNoteEl.innerHTML =
        `Join the live chat 👉 <a href="https://www.youtube.com/watch?v=${videoId}" target="_blank" rel="noopener">Open stream</a>`;
    } else {
      streamTimeEl.textContent = startText ? `Scheduled: ${startText}` : "Upcoming – time TBA";
      streamNoteEl.innerHTML =
        `Set a reminder on YouTube 👉 <a href="https://www.youtube.com/watch?v=${videoId}" target="_blank" rel="noopener">View stream</a>`;
    }
  } catch (err) {
    console.error("Error loading next stream:", err);
    // If it fails, just keep the static text
  }
}

// ---- Load Latest Thumbnail for Hero Background ----
async function loadHeroThumbnail() {
  try {
    const url =
      `https://www.googleapis.com/youtube/v3/search` +
      `?key=${API_KEY}` +
      `&channelId=${CHANNEL_ID}` +
      `&part=snippet,id` +
      `&order=date` +
      `&maxResults=1` +
      `&type=video`;

    const res = await fetch(url);
    const data = await res.json();

    // Check for API errors
    if (data.error) {
      console.error('YouTube API Error (thumbnail):', data.error.message);
      return;
    }

    if (data.items && data.items.length > 0) {
      const item = data.items[0];
      const thumbnails = item.snippet.thumbnails;
      const thumbUrl = thumbnails.maxres?.url || thumbnails.high?.url || thumbnails.medium?.url;

      if (thumbUrl) {
        const heroSection = document.querySelector('.hero');
        if (heroSection) {
          // Create a subtle background overlay with the thumbnail
          const bgOverlay = document.createElement('div');
          bgOverlay.style.cssText = `
            position: absolute;
            inset: 0;
            background-image: url('${thumbUrl}');
            background-size: cover;
            background-position: center;
            opacity: 0.08;
            filter: blur(8px);
            z-index: 0;
            pointer-events: none;
          `;
          heroSection.insertBefore(bgOverlay, heroSection.firstChild);
        }
      }
    }
  } catch (error) {
    console.error('Error loading hero thumbnail:', error);
  }
}

// Run all loaders
loadChannelStats();
loadHeroThumbnail();
loadLatestVideos();
loadNextStream();
