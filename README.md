# JUST FOR FUN - Gaming Channel Website 🎮

Modern, responsive website for the JUST FOR FUN YouTube gaming channel featuring dynamic content loading via YouTube Data API v3.

## 🚀 Features

- **Dynamic YouTube Integration**: Automatically fetches channel stats, latest videos, and upcoming streams
- **Modern Design**: Indigo/purple gradient theme with smooth animations
- **Responsive Layout**: Works perfectly on desktop, tablet, and mobile devices
- **Loading Screen**: Animated loading experience with progress bar
- **Merch Section**: "Coming Soon" preview section for future merchandise
- **Contact Form**: Easy-to-use contact form for business inquiries
- **Social Media Links**: Quick access to all social platforms

## 📋 Setup Instructions

### 1. Update Your Information

Replace the following placeholders in `index.html`:

- **Email**: Line 478 - Replace `your-email@example.com` with your actual email
- **Discord**: Line 409 - Replace `https://discord.gg/yourserver` with your Discord invite link
- **Instagram**: Line 419 - Replace `https://instagram.com/justforfun` with your Instagram profile
- **Twitter**: Line 437 - Replace `https://twitter.com/justforfun` with your Twitter/X profile

### 2. YouTube API Setup

The website uses YouTube Data API v3 to fetch real-time channel data.

**Current API Key**: `AIzaSyCk2HpROQNkxb3kFlyfjRu1i_wPry_J9wI`
**Channel ID**: `UCcCp0B0bypJE4EJjwq8u2lQ`

#### API Quota Management

- **Daily Quota**: 10,000 queries per day
- **Quota Reset**: Midnight Pacific Time (≈3:30 PM Sri Lanka Time)
- **Fallback Values**: Website displays static values when quota is exceeded

To increase your quota:
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to "APIs & Services" → "Quotas"
3. Find "YouTube Data API v3"
4. Request a quota increase if needed

### 3. File Structure

```
just-for-fun-website/
├── index.html          # Main HTML structure
├── style.css           # All styling (2551 lines)
├── script.js           # JavaScript & YouTube API integration (368 lines)
├── images/
│   └── logo-jff.png   # Channel logo
└── README.md          # This file
```

## 🎨 Color Scheme

- **Primary**: Indigo (#6366f1)
- **Secondary**: Purple (#8b5cf6)
- **Accent**: Pink (#ec4899)
- **Background**: Dark (#0a0b0f)
- **Text**: White (#f9fafb)

## ⚡ JavaScript Functions

- `loadChannelStats()` - Fetches subscriber count, video count, and total views
- `loadLatestVideos()` - Displays 6 most recent videos
- `loadNextStream()` - Shows live or upcoming stream information
- `loadHeroThumbnail()` - Sets latest video thumbnail as hero background
- `setFallbackStats()` - Displays default values when API is unavailable

## 🐛 Known Issues & Solutions

### Issue: YouTube API Quota Exceeded
**Solution**: Website automatically displays fallback values (1K+ subscribers, 50+ videos, 10K+ views) until quota resets.

### Issue: Stats Show "Loading..."
**Solution**: This means the API call failed. Check:
1. API quota in Google Cloud Console
2. API key is valid and unrestricted
3. Internet connection is stable

## 🌐 Browser Compatibility

- ✅ Chrome/Edge (Recommended)
- ✅ Firefox
- ✅ Safari
- ✅ Mobile browsers

## 📱 Responsive Breakpoints

- Desktop: 1024px+
- Tablet: 768px - 1023px
- Mobile: 320px - 767px

## 🚀 Deployment

Simply upload all files to your web hosting service:
- GitHub Pages
- Netlify
- Vercel
- Any static hosting provider

## 📝 License

© 2025 JUST FOR FUN • All rights reserved

---

**Made with ❤️ for the gaming community**
