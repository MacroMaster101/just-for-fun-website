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

// ===== NETLIFY IDENTITY AUTHENTICATION =====

// Initialize Netlify Identity
if (window.netlifyIdentity) {
  window.netlifyIdentity.on("init", user => {
    updateAuthUI(user);
  });

  window.netlifyIdentity.on("login", user => {
    updateAuthUI(user);
    window.netlifyIdentity.close();
    showWelcomeMessage(user);
  });

  window.netlifyIdentity.on("logout", () => {
    updateAuthUI(null);
    showLogoutMessage();
  });
}

// Login and Sign Up button handlers
const loginButton = document.getElementById('login-button');
const signupButton = document.getElementById('signup-button');

if (loginButton) {
  loginButton.addEventListener('click', () => {
    if (window.netlifyIdentity) {
      window.netlifyIdentity.open('login');
    }
  });
}

if (signupButton) {
  signupButton.addEventListener('click', () => {
    if (window.netlifyIdentity) {
      window.netlifyIdentity.open('signup');
    }
  });
}

// Update authentication UI based on user state
function updateAuthUI(user) {
  const authButtons = document.getElementById('auth-buttons');
  const userMenu = document.getElementById('user-menu');
  
  if (user) {
    // User is logged in
    authButton.style.display = 'none';
    userMenu.style.display = 'block';
    
    // Update user info
    const userName = document.getElementById('user-name');
    const userEmail = document.getElementById('user-email');
    
    if (userName) userName.textContent = user.user_metadata?.full_name || 'Gamer';
    if (userEmail) userEmail.textContent = user.email;
  } else {
    // User is logged out
    authButton.style.display = 'flex';
    userMenu.style.display = 'none';
  }
}

// Logout button handler
const logoutButton = document.getElementById('logout-button');
if (logoutButton) {
  logoutButton.addEventListener('click', () => {
    if (window.netlifyIdentity) {
      window.netlifyIdentity.logout();
    }
  });
}

// Close user menu when clicking outside or on profile link
document.addEventListener('click', (e) => {
  const userMenu = document.getElementById('user-menu');
  const userAvatar = document.querySelector('.user-avatar');
  
  if (!userMenu) return;
  
  // Close menu when clicking outside
  if (userMenu.style.display === 'block' && 
      !userMenu.contains(e.target) && 
      e.target !== userAvatar &&
      !e.target.closest('.user-menu')) {
    userMenu.style.display = 'none';
  }
  
  // Close menu when clicking profile link
  if (e.target.classList.contains('btn-profile') || 
      e.target.closest('.btn-profile')) {
    userMenu.style.display = 'none';
  }
});

// Toggle user menu when clicking user avatar
document.addEventListener('click', (e) => {
  const userAvatar = document.querySelector('.user-avatar');
  const userMenu = document.getElementById('user-menu');
  
  if (userAvatar && userMenu && e.target === userAvatar) {
    if (userMenu.style.display === 'block') {
      userMenu.style.display = 'none';
    } else {
      userMenu.style.display = 'block';
    }
  }
});

// Welcome message
function showWelcomeMessage(user) {
  const name = user.user_metadata?.full_name || 'Gamer';
  
  // Create toast notification
  const toast = document.createElement('div');
  toast.className = 'auth-toast';
  toast.innerHTML = `
    <div class="toast-icon">🎮</div>
    <div class="toast-content">
      <div class="toast-title">Welcome back, ${name}!</div>
      <div class="toast-message">You're now logged in</div>
    </div>
  `;
  document.body.appendChild(toast);
  
  setTimeout(() => toast.classList.add('show'), 100);
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// Logout message
function showLogoutMessage() {
  const toast = document.createElement('div');
  toast.className = 'auth-toast';
  toast.innerHTML = `
    <div class="toast-icon">👋</div>
    <div class="toast-content">
      <div class="toast-title">Logged out</div>
      <div class="toast-message">See you next time!</div>
    </div>
  `;
  document.body.appendChild(toast);
  
  setTimeout(() => toast.classList.add('show'), 100);
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// ===== USER PROFILE SYSTEM =====

let currentUser = null;
let currentProfile = null;

// Override updateAuthUI to include profile logic
function updateAuthUI(user) {
  const authButtons = document.getElementById('auth-buttons');
  const userMenu = document.getElementById('user-menu');
  const profileSection = document.getElementById('profile');
  const profileNavLink = document.getElementById('profile-nav-link');
  
  currentUser = user;
  
  if (user) {
    // User is logged in
    if (authButtons) authButtons.style.display = 'none';
    if (userMenu) userMenu.style.display = 'block';
    if (profileSection) profileSection.style.display = 'block';
    if (profileNavLink) profileNavLink.style.display = 'block';
    
    // Load user profile first to get username
    loadUserProfile(user).then(() => {
      // Update user info with username from profile or fallback
      const userName = document.getElementById('user-name');
      const userEmail = document.getElementById('user-email');
      
      if (userName) {
        userName.textContent = currentProfile?.username || user.user_metadata?.full_name || 'Gamer';
      }
      if (userEmail) userEmail.textContent = user.email;
    });
  } else {
    // User is logged out
    if (authButtons) authButtons.style.display = 'flex';
    if (userMenu) userMenu.style.display = 'none';
    if (profileSection) profileSection.style.display = 'none';
    if (profileNavLink) profileNavLink.style.display = 'none';
    currentProfile = null;
  }
}

// Load user profile from database
async function loadUserProfile(user) {
  try {
    const response = await fetch(`/.netlify/functions/get-profile?userId=${user.id}`);
    const data = await response.json();
    
    if (response.ok) {
      currentProfile = data;
      displayProfile(user, data);
      return data;
    } else {
      console.error('Error loading profile:', data.error);
      const defaultProfile = { username: user.user_metadata?.full_name || 'Gamer', bio: '', exists: false };
      currentProfile = defaultProfile;
      displayProfile(user, defaultProfile);
      return defaultProfile;
    }
  } catch (error) {
    console.error('Error fetching profile:', error);
    const defaultProfile = { username: user.user_metadata?.full_name || 'Gamer', bio: '', exists: false };
    currentProfile = defaultProfile;
    displayProfile(user, defaultProfile);
    return defaultProfile;
  }
}

// Display profile data
function displayProfile(user, profile) {
  const displayName = document.getElementById('profile-display-name');
  const displayEmail = document.getElementById('profile-display-email');
  const joinedDate = document.getElementById('profile-joined-date');
  const usernameInput = document.getElementById('profile-username');
  const bioTextarea = document.getElementById('profile-bio');
  const avatarEl = document.getElementById('profile-avatar');
  
  if (displayName) displayName.textContent = profile.username || user.user_metadata?.full_name || 'Gamer';
  if (displayEmail) displayEmail.textContent = user.email;
  
  if (joinedDate) {
    const joined = new Date(user.created_at).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
    joinedDate.textContent = joined;
  }
  
  if (usernameInput) usernameInput.value = profile.username || user.user_metadata?.full_name || '';
  if (bioTextarea) bioTextarea.value = profile.bio || '';
  
  updateCharCount();
  
  if (avatarEl) {
    avatarEl.textContent = profile.avatarUrl || '👤';
  }
}

// Update bio character count
function updateCharCount() {
  const bioTextarea = document.getElementById('profile-bio');
  const charCount = document.getElementById('bio-char-count');
  if (bioTextarea && charCount) {
    charCount.textContent = bioTextarea.value.length;
  }
}

// Save profile
async function saveProfile() {
  if (!currentUser) {
    showProfileMessage('Please log in to save your profile', 'error');
    return;
  }

  const username = document.getElementById('profile-username').value.trim();
  const bio = document.getElementById('profile-bio').value.trim();
  
  if (!username) {
    showProfileMessage('Username is required', 'error');
    return;
  }

  const saveBtn = document.getElementById('save-profile-btn');
  saveBtn.disabled = true;
  saveBtn.innerHTML = '<span class="btn-icon">⏳</span> Saving...';

  try {
    const response = await fetch('/.netlify/functions/update-profile', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        userId: currentUser.id,
        username,
        bio,
        avatarUrl: null
      })
    });

    const data = await response.json();

    if (response.ok) {
      currentProfile = data.profile;
      showProfileMessage('Profile saved successfully! 🎉', 'success');
      
      const displayName = document.getElementById('profile-display-name');
      const userName = document.getElementById('user-name');
      if (displayName) displayName.textContent = username;
      if (userName) userName.textContent = username;
    } else {
      showProfileMessage(`Error: ${data.error}`, 'error');
    }
  } catch (error) {
    console.error('Error saving profile:', error);
    showProfileMessage('Failed to save profile. Please try again.', 'error');
  } finally {
    saveBtn.disabled = false;
    saveBtn.innerHTML = '<span class="btn-icon">💾</span> Save Profile';
  }
}

// Show profile message
function showProfileMessage(message, type = 'success') {
  const messageEl = document.getElementById('profile-message');
  if (messageEl) {
    messageEl.textContent = message;
    messageEl.className = `profile-message ${type}`;
    messageEl.style.display = 'block';
    
    setTimeout(() => {
      messageEl.style.display = 'none';
    }, 5000);
  }
}

// Event listeners for profile
document.addEventListener('DOMContentLoaded', () => {
  const bioTextarea = document.getElementById('profile-bio');
  if (bioTextarea) {
    bioTextarea.addEventListener('input', updateCharCount);
  }

  const saveBtn = document.getElementById('save-profile-btn');
  if (saveBtn) {
    saveBtn.addEventListener('click', saveProfile);
  }

  const cancelBtn = document.getElementById('cancel-profile-btn');
  if (cancelBtn) {
    cancelBtn.addEventListener('click', () => {
      if (currentUser && currentProfile) {
        displayProfile(currentUser, currentProfile);
        showProfileMessage('Changes canceled', 'info');
      }
    });
  }

  const avatarEditBtn = document.getElementById('avatar-edit-btn');
  if (avatarEditBtn) {
    avatarEditBtn.addEventListener('click', () => {
      alert('Avatar upload feature coming soon! 🎨');
    });
  }
});
