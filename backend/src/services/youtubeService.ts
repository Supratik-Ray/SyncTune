import { Video } from "../types";

// Curated list of verified embeddable music tracks for out-of-the-box prototype testing
const FALLBACK_CATALOG: Video[] = [
  {
    videoId: "jfKfPfyJRdk",
    title: "lofi hip hop radio 📚 - beats to relax/study to",
    channelTitle: "Lofi Girl",
    thumbnail: "https://i.ytimg.com/vi/jfKfPfyJRdk/hqdefault.jpg",
    duration: "LIVE",
  },
  {
    videoId: "4xDzrJKXOOY",
    title: "SYNTHWAVE RADIO 🌌 - chill synth / retro beats",
    channelTitle: "Lofi Girl",
    thumbnail: "https://i.ytimg.com/vi/4xDzrJKXOOY/hqdefault.jpg",
    duration: "LIVE",
  },
  {
    videoId: "fJ9rUzIMcZQ",
    title: "Queen – Bohemian Rhapsody (Official Video Remastered)",
    channelTitle: "Queen Official",
    thumbnail: "https://i.ytimg.com/vi/fJ9rUzIMcZQ/hqdefault.jpg",
    duration: "5:59",
  },
  {
    videoId: "4NRXx6U8ABQ",
    title: "The Weeknd - Blinding Lights (Official Music Video)",
    channelTitle: "The Weeknd",
    thumbnail: "https://i.ytimg.com/vi/4NRXx6U8ABQ/hqdefault.jpg",
    duration: "4:22",
  },
  {
    videoId: "kJQP7kiw5Fk",
    title: "Luis Fonsi - Despacito ft. Daddy Yankee",
    channelTitle: "Luis Fonsi",
    thumbnail: "https://i.ytimg.com/vi/kJQP7kiw5Fk/hqdefault.jpg",
    duration: "4:42",
  },
  {
    videoId: "JGwWNGJdvx8",
    title: "Ed Sheeran - Shape of You (Official Music Video)",
    channelTitle: "Ed Sheeran",
    thumbnail: "https://i.ytimg.com/vi/JGwWNGJdvx8/hqdefault.jpg",
    duration: "4:24",
  },
  {
    videoId: "OPf0YbXqDm0",
    title: "Mark Ronson - Uptown Funk (Official Video) ft. Bruno Mars",
    channelTitle: "Mark Ronson",
    thumbnail: "https://i.ytimg.com/vi/OPf0YbXqDm0/hqdefault.jpg",
    duration: "4:30",
  },
  {
    videoId: "hT_nvWreIhg",
    title: "OneRepublic - Counting Stars (Official Music Video)",
    channelTitle: "OneRepublic",
    thumbnail: "https://i.ytimg.com/vi/hT_nvWreIhg/hqdefault.jpg",
    duration: "4:43",
  },
  {
    videoId: "09R8_2nJtjg",
    title: "Maroon 5 - Sugar (Official Music Video)",
    channelTitle: "Maroon 5",
    thumbnail: "https://i.ytimg.com/vi/09R8_2nJtjg/hqdefault.jpg",
    duration: "5:02",
  },
  {
    videoId: "kXYiU_JCYtU",
    title: "Numb - Linkin Park (Official Music Video) [4K UPGRADE]",
    channelTitle: "Linkin Park",
    thumbnail: "https://i.ytimg.com/vi/kXYiU_JCYtU/hqdefault.jpg",
    duration: "3:07",
  },
  {
    videoId: "L_LUpnjgPso",
    title: "Coldplay - Viva La Vida (Official Video)",
    channelTitle: "Coldplay",
    thumbnail: "https://i.ytimg.com/vi/L_LUpnjgPso/hqdefault.jpg",
    duration: "4:03",
  },
  {
    videoId: "a5uQMwRMHcs",
    title:
      "Daft Punk - Get Lucky (Official Audio) ft. Pharrell Williams, Nile Rodgers",
    channelTitle: "Daft Punk",
    thumbnail: "https://i.ytimg.com/vi/a5uQMwRMHcs/hqdefault.jpg",
    duration: "4:08",
  },
  {
    videoId: "YykjpeuMNEk",
    title: "Coldplay - Hymn For The Weekend (Official Video)",
    channelTitle: "Coldplay",
    thumbnail: "https://i.ytimg.com/vi/YykjpeuMNEk/hqdefault.jpg",
    duration: "4:26",
  },
  {
    videoId: "SlPhMPnQ58k",
    title: "Memories - Maroon 5 (Official Video)",
    channelTitle: "Maroon 5",
    thumbnail: "https://i.ytimg.com/vi/SlPhMPnQ58k/hqdefault.jpg",
    duration: "3:15",
  },
];

function parseIsoDuration(duration: string): string {
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return "";
  const hours = parseInt(match[1] || "0", 10);
  const minutes = parseInt(match[2] || "0", 10);
  const seconds = parseInt(match[3] || "0", 10);

  const formattedSeconds = seconds < 10 ? `0${seconds}` : `${seconds}`;
  if (hours > 0) {
    const formattedMinutes = minutes < 10 ? `0${minutes}` : `${minutes}`;
    return `${hours}:${formattedMinutes}:${formattedSeconds}`;
  }
  return `${minutes}:${formattedSeconds}`;
}

export async function searchYouTube(query: string): Promise<Video[]> {
  const trimmed = query.trim().toLowerCase();
  const apiKey = process.env.YOUTUBE_API_KEY?.trim();

  // If query is empty, return a selection of default tracks
  if (!trimmed) {
    return FALLBACK_CATALOG.slice(0, 8);
  }

  // If an API key is provided, attempt live YouTube Data API search
  if (apiKey) {
    try {
      // 1. Search for video IDs with music preference
      const searchUrl = new URL("https://www.googleapis.com/youtube/v3/search");
      searchUrl.searchParams.set("part", "snippet");
      searchUrl.searchParams.set("q", `${query} music`);
      searchUrl.searchParams.set("type", "video");
      searchUrl.searchParams.set("videoEmbeddable", "true");
      searchUrl.searchParams.set("maxResults", "15");
      searchUrl.searchParams.set("key", apiKey);

      const searchRes = await fetch(searchUrl.toString());
      if (!searchRes.ok) {
        console.warn(
          `YouTube API search error ${searchRes.status}. Using catalog fallback.`,
        );
        return searchFallback(trimmed);
      }

      const searchData = (await searchRes.json()) as any;
      const videoItems = searchData.items || [];
      const videoIds = videoItems
        .map((item: any) => item.id?.videoId)
        .filter(Boolean)
        .join(",");

      if (!videoIds) {
        return searchFallback(trimmed);
      }

      // 2. Fetch content details (duration)
      const detailsUrl = new URL(
        "https://www.googleapis.com/youtube/v3/videos",
      );
      detailsUrl.searchParams.set("part", "contentDetails,snippet,status");
      detailsUrl.searchParams.set("id", videoIds);
      detailsUrl.searchParams.set("key", apiKey);

      const detailsRes = await fetch(detailsUrl.toString());
      if (!detailsRes.ok) {
        return videoItems.map((item: any) => ({
          videoId: item.id.videoId,
          title: item.snippet.title,
          thumbnail:
            item.snippet.thumbnails?.medium?.url ||
            item.snippet.thumbnails?.default?.url,
          channelTitle: item.snippet.channelTitle,
          duration: "",
        }));
      }

      const detailsData = (await detailsRes.json()) as any;
      const detailsMap = new Map<string, any>();
      for (const item of detailsData.items || []) {
        detailsMap.set(item.id, item);
      }

      return videoItems
        .filter((item: any) => {
          const detail = detailsMap.get(item.id.videoId);
          // Only return embeddable videos
          return detail?.status?.embeddable !== false;
        })
        .map((item: any) => {
          const detail = detailsMap.get(item.id.videoId);
          const rawDuration = detail?.contentDetails?.duration || "";
          return {
            videoId: item.id.videoId,
            title: item.snippet.title,
            thumbnail:
              item.snippet.thumbnails?.medium?.url ||
              item.snippet.thumbnails?.default?.url,
            channelTitle: item.snippet.channelTitle,
            duration: rawDuration ? parseIsoDuration(rawDuration) : "",
          };
        });
    } catch (err) {
      console.error("Failed to query YouTube API:", err);
      return searchFallback(trimmed);
    }
  }

  // If no API key provided, use matching items from fallback catalog
  return searchFallback(trimmed);
}

function searchFallback(trimmed: string): Video[] {
  const matches = FALLBACK_CATALOG.filter(
    (v) =>
      v.title.toLowerCase().includes(trimmed) ||
      (v.channelTitle && v.channelTitle.toLowerCase().includes(trimmed)),
  );

  // If specific query matches nothing, return sample catalog with simulated query results
  if (matches.length > 0) {
    return matches;
  }

  // Return full catalog so user can always pick and test videos
  return FALLBACK_CATALOG;
}
