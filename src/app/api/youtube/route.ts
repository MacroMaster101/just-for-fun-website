import { NextResponse } from "next/server";

const API_KEY = process.env.YOUTUBE_API_KEY || "AIzaSyAZ1Z_JmzSKeeWFys9FfJdXCj4OdZSsiTs";
const CHANNEL_ID = process.env.YOUTUBE_CHANNEL_ID || "UCcCp0B0bypJE4EJjwq8u2lQ";

export async function GET() {
  try {
    // 1. Fetch statistics
    const statsUrl = `https://www.googleapis.com/youtube/v3/channels?key=${API_KEY}&id=${CHANNEL_ID}&part=statistics,snippet`;
    const statsRes = await fetch(statsUrl, {
      next: { revalidate: 3600 }, // Cache for 1 hour
    });
    const statsData = await statsRes.json();

    let stats = {
      subscribers: "1K+",
      videos: "50+",
      views: "10K+",
    };

    if (statsData.items && statsData.items.length > 0) {
      const channelStats = statsData.items[0].statistics;
      const subs = parseInt(channelStats.subscriberCount);
      const views = parseInt(channelStats.viewCount);

      stats = {
        subscribers: subs >= 1000 ? `${Math.floor(subs / 1000)}K+` : subs.toString(),
        videos: channelStats.videoCount || "50+",
        views:
          views >= 1000000
            ? `${(views / 1000000).toFixed(1)}M`
            : views >= 1000
            ? `${Math.floor(views / 1000)}K+`
            : views.toString(),
      };
    }

    // 2. Fetch latest videos
    const videosUrl = `https://www.googleapis.com/youtube/v3/search?key=${API_KEY}&channelId=${CHANNEL_ID}&part=snippet,id&order=date&maxResults=6&type=video`;
    const videosRes = await fetch(videosUrl, {
      next: { revalidate: 3600 }, // Cache for 1 hour
    });
    const videosData = await videosRes.json();

    interface YouTubeSearchItem {
      id: {
        kind: string;
        videoId?: string;
      };
      snippet: {
        title: string;
        publishedAt: string;
        thumbnails: {
          high?: { url: string };
          medium?: { url: string };
          default?: { url: string };
        };
      };
    }

    interface VideoItem {
      id: string;
      title: string;
      thumbnail: string;
      publishedAt: string;
    }

    let videos: VideoItem[] = [];

    if (videosData.items && videosData.items.length > 0) {
      videos = (videosData.items as YouTubeSearchItem[])
        .filter((item) => item.id.kind === "youtube#video")
        .map((item) => {
          const thumbnails = item.snippet.thumbnails;
          const thumbUrl =
            thumbnails.high?.url || thumbnails.medium?.url || thumbnails.default?.url || "";
          return {
            id: item.id.videoId || "",
            title: item.snippet.title,
            thumbnail: thumbUrl,
            publishedAt: item.snippet.publishedAt,
          };
        });
    }

    return NextResponse.json({ stats, videos });
  } catch (error) {
    console.error("YouTube API Proxy Error:", error);
    // Return fallback stats and empty videos array if error occurs
    return NextResponse.json({
      stats: {
        subscribers: "1K+",
        videos: "50+",
        views: "10K+",
      },
      videos: [],
    });
  }
}
