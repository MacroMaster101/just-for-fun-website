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
├── style.css           # All styling (2601 lines)
├── script.js           # JavaScript & YouTube API integration (370 lines)
├── netlify.toml        # Netlify configuration
├── _redirects          # Netlify redirect rules
├── .gitignore          # Git ignore file
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

### Deploy to Netlify

#### Option 1: Deploy via GitHub (Recommended)

1. **Push to GitHub**:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/just-for-fun-website.git
   git push -u origin main
   ```

2. **Connect to Netlify**:
   - Go to [Netlify](https://app.netlify.com/)
   - Click "Add new site" → "Import an existing project"
   - Choose "GitHub" and select your repository
   - Click "Deploy site"
   - Your site will be live at `https://random-name.netlify.app`

3. **Custom Domain** (Optional):
   - Go to Site settings → Domain management
   - Click "Add custom domain"
   - Follow the instructions to set up your domain

#### Option 2: Deploy via Drag & Drop

1. Go to [Netlify Drop](https://app.netlify.com/drop)
2. Drag and drop your entire project folder
3. Your site will be live instantly!

#### Option 3: Netlify CLI

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login to Netlify
netlify login

# Deploy
netlify deploy --prod
```

### Alternative Hosting Options

- **GitHub Pages**: Enable in repository settings → Pages
- **Vercel**: Import from GitHub at [vercel.com](https://vercel.com)
- **Cloudflare Pages**: Connect GitHub repo at [pages.cloudflare.com](https://pages.cloudflare.com)

## 📂 GitHub Setup

### First Time Setup

```bash
# Navigate to your project folder
cd "c:\Users\Kavisha Lakshan\OneDrive\Documents\GitHub\just-for-fun-website"

# Initialize Git repository
git init

# Add all files
git add .

# Create first commit
git commit -m "Initial commit: JUST FOR FUN gaming website"

# Create main branch
git branch -M main

# Add your GitHub repository (create one first on github.com)
git remote add origin https://github.com/YOUR_USERNAME/just-for-fun-website.git

# Push to GitHub
git push -u origin main
```

### Future Updates

```bash
# Add changes
git add .

# Commit with a message
git commit -m "Update content"

# Push to GitHub
git push
```

## 📝 License

© 2026 JUST FOR FUN • All rights reserved

---

**Made with ❤️ for the gaming community**
