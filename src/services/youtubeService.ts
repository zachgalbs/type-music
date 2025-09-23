interface YouTubeSearchResult {
  videoId: string;
  title: string;
  channelTitle: string;
  description: string;
  thumbnails: {
    default: { url: string; width: number; height: number };
    medium: { url: string; width: number; height: number };
    high: { url: string; width: number; height: number };
  };
  publishedAt: string;
  duration?: string;
}

interface YouTubeProxyResponse {
  items: {
    videoId: string;
    title: string;
    channelTitle: string;
    description: string;
    thumbnails: {
      default: { url: string; width: number; height: number };
      medium: { url: string; width: number; height: number };
      high: { url: string; width: number; height: number };
    };
    publishedAt: string;
    duration?: string;
  }[];
  pageInfo: {
    totalResults: number;
    resultsPerPage: number;
  };
}

export class YouTubeService {
  private readonly searchEndpoints: string[];

  constructor() {
    const configuredBase = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/$/, '');
    const endpoints = new Set<string>();

    if (configuredBase) {
      endpoints.add(`${configuredBase}/api/youtube/search`);
    }

    // Same-origin (relative) endpoint works in production and via Vite proxy in dev
    endpoints.add('/api/youtube/search');

    // Explicit same-origin absolute URL (avoids issues when fetch requires absolute URLs)
    if (typeof window !== 'undefined') {
      const origin = window.location.origin.replace(/\/$/, '');
      endpoints.add(`${origin}/api/youtube/search`);
    }

    // Dev fallback: direct to local proxy in case Vite proxy isn't configured
    endpoints.add('http://localhost:8787/api/youtube/search');

    this.searchEndpoints = Array.from(endpoints);
  }

  async searchVideos(query: string, maxResults: number = 10): Promise<YouTubeSearchResult[]> {
    try {
      const searchParams = new URLSearchParams({
        q: query,
        maxResults: Math.min(Math.max(maxResults, 1), 10).toString()
      });
      let lastNetworkError: unknown = null;

      for (const endpoint of this.searchEndpoints) {
        let response: Response;

        try {
          response = await fetch(`${endpoint}?${searchParams.toString()}`);
        } catch (networkError) {
          lastNetworkError = networkError;
          console.warn(`YouTube search attempt failed for ${endpoint}:`, networkError);
          continue;
        }

        if (!response.ok) {
          if (response.status === 403) {
            throw new Error('YouTube API quota exceeded or server API key misconfigured');
          }

          if (response.status === 503) {
            throw new Error('YouTube proxy is not configured with an API key. Set YOUTUBE_API_KEY on the server.');
          }

          const body = await response.text();
          throw new Error(`YouTube API error: ${response.status} ${response.statusText}${body ? ` - ${body}` : ''}`);
        }

        const data: YouTubeProxyResponse = await response.json();

        return data.items.map(item => ({
          videoId: item.videoId,
          title: item.title,
          channelTitle: item.channelTitle,
          description: item.description,
          thumbnails: item.thumbnails,
          publishedAt: item.publishedAt,
          duration: item.duration
        }));
      }

      const fallbackMessage = 'Unable to reach the YouTube search proxy. If you are running locally, start it with `YOUTUBE_API_KEY=your-key npm run server`.';
      if (lastNetworkError instanceof Error) {
        throw new Error(`${fallbackMessage} (${lastNetworkError.message})`);
      }
      throw new Error(fallbackMessage);
    } catch (error) {
      console.error('YouTube search failed:', error);
      throw error;
    }
  }

  async searchBestMatch(trackName: string, artistName: string): Promise<string | null> {
    try {
      // Try different search queries in order of specificity
      // Put quotes around track name for more exact matching
      const queries = [
        `"${trackName}" ${artistName} official music video`,
        `${artistName} - ${trackName} official`,
        `"${trackName}" ${artistName} official video`,
        `${artistName} "${trackName}"`,
        `${trackName} ${artistName} official music video`,
        `${trackName} ${artistName} official`,
        `${trackName} ${artistName}`
      ];

      for (const query of queries) {
        console.log(`Searching YouTube for: "${query}"`);
        
        try {
          const results = await this.searchVideos(query, 5);
          
          if (results.length > 0) {
            // Score results based on relevance
            const scoredResults = results.map(result => ({
              ...result,
              score: this.calculateRelevanceScore(result, trackName, artistName)
            }));

            // Sort by score (highest first)
            scoredResults.sort((a, b) => b.score - a.score);
            
            const bestMatch = scoredResults[0];
            console.log(`Best match for "${query}":`, {
              title: bestMatch.title,
              channel: bestMatch.channelTitle,
              score: bestMatch.score,
              videoId: bestMatch.videoId
            });

            return bestMatch.videoId;
          }
        } catch (error) {
          console.log(`Query "${query}" failed:`, error);
          continue;
        }
      }

      console.warn('No YouTube videos found for:', { trackName, artistName });
      return null;

    } catch (error) {
      console.error('YouTube search error:', error);
      return null;
    }
  }

  private calculateRelevanceScore(result: YouTubeSearchResult, trackName: string, artistName: string): number {
    let score = 0;
    const title = result.title.toLowerCase();
    const channel = result.channelTitle.toLowerCase();
    const track = trackName.toLowerCase();
    const artist = artistName.toLowerCase();

    // Check for exact match of "Artist - Track" pattern (highest priority)
    const exactPattern1 = `${artist} - ${track}`;
    const exactPattern2 = `${artist}: ${track}`;
    const exactPattern3 = `${artist} "${track}"`;
    const exactPattern4 = `${artist} '${track}'`;
    
    if (title.includes(exactPattern1) || title.includes(exactPattern2) || 
        title.includes(exactPattern3) || title.includes(exactPattern4)) {
      score += 50; // Very high score for exact pattern match
    }

    // Check if track name appears as a distinct element (not part of another word)
    // This is especially important for short track names like "8"
    const titleWords = title.split(/[\s\-–—:,\(\)\[\]"']+/);
    const trackWords = track.split(/\s+/);
    
    // Check for exact word matches (case-insensitive)
    trackWords.forEach(trackWord => {
      if (titleWords.includes(trackWord)) {
        score += 30; // High score for exact word match
      } else if (title.includes(track)) {
        score += 15; // Lower score for substring match
      }
    });

    // Artist name matching
    if (title.includes(artist)) score += 20;
    if (channel.includes(artist)) score += 15;

    // Partial word matches for longer track/artist names
    const trackWordsLong = track.split(/\s+/).filter(word => word.length > 2);
    const artistWordsLong = artist.split(/\s+/).filter(word => word.length > 2);

    trackWordsLong.forEach(word => {
      if (title.includes(word) && !titleWords.includes(word)) score += 3;
    });

    artistWordsLong.forEach(word => {
      if (title.includes(word) && !title.includes(artist)) score += 3;
      if (channel.includes(word) && !channel.includes(artist)) score += 5;
    });

    // Official content indicators
    if (title.includes('official')) score += 15;
    if (channel.includes('official')) score += 10;
    if (title.includes('music video') || title.includes('mv')) score += 10;
    if (channel.includes(artist)) score += 12;

    // VEVO channels are typically official
    if (channel.includes('vevo')) score += 15;

    // Penalize content that's likely not the original
    if (title.includes('cover') && !title.includes('official')) score -= 15;
    if (title.includes('remix') && !title.includes('official')) score -= 10;
    if (title.includes('karaoke')) score -= 20;
    if (title.includes('instrumental')) score -= 10;
    if (title.includes('lyrics') && !title.includes('official')) score -= 5;
    if (title.includes('reaction')) score -= 25;
    if (title.includes('review')) score -= 25;

    // Prefer videos from recent years but not too recent (official content)
    const publishedYear = new Date(result.publishedAt).getFullYear();
    const currentYear = new Date().getFullYear();
    const yearsOld = currentYear - publishedYear;
    
    if (yearsOld >= 0 && yearsOld <= 15) score += 2; // Recent but not brand new
    if (yearsOld > 20) score -= 3; // Very old might be lower quality

    return Math.max(0, score); // Don't return negative scores
  }

}

export const youtubeService = new YouTubeService();
