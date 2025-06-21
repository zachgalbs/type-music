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

interface YouTubeApiResponse {
  items: {
    id: { videoId: string };
    snippet: {
      title: string;
      channelTitle: string;
      description: string;
      thumbnails: {
        default: { url: string; width: number; height: number };
        medium: { url: string; width: number; height: number };
        high: { url: string; width: number; height: number };
      };
      publishedAt: string;
    };
    contentDetails?: {
      duration: string;
    };
  }[];
  pageInfo: {
    totalResults: number;
    resultsPerPage: number;
  };
}

export class YouTubeService {
  private apiKey: string = '';
  private readonly baseUrl = 'https://www.googleapis.com/youtube/v3';

  setApiKey(key: string): void {
    this.apiKey = key;
  }

  async searchVideos(query: string, maxResults: number = 10): Promise<YouTubeSearchResult[]> {
    if (!this.apiKey) {
      throw new Error('YouTube API key not set. Call setApiKey() first.');
    }

    try {
      const searchParams = new URLSearchParams({
        part: 'snippet',
        q: query,
        type: 'video',
        maxResults: maxResults.toString(),
        key: this.apiKey,
        videoEmbeddable: 'true', // Only return embeddable videos
        order: 'relevance'
      });

      const response = await fetch(`${this.baseUrl}/search?${searchParams}`);
      
      if (!response.ok) {
        if (response.status === 403) {
          throw new Error('YouTube API quota exceeded or invalid API key');
        }
        throw new Error(`YouTube API error: ${response.status} ${response.statusText}`);
      }

      const data: YouTubeApiResponse = await response.json();

      return data.items.map(item => ({
        videoId: item.id.videoId,
        title: item.snippet.title,
        channelTitle: item.snippet.channelTitle,
        description: item.snippet.description,
        thumbnails: item.snippet.thumbnails,
        publishedAt: item.snippet.publishedAt,
        duration: item.contentDetails?.duration
      }));

    } catch (error) {
      console.error('YouTube search failed:', error);
      throw error;
    }
  }

  async searchBestMatch(trackName: string, artistName: string): Promise<string | null> {
    try {
      // Try different search queries in order of specificity
      const queries = [
        `${trackName} ${artistName} official music video`,
        `${trackName} ${artistName} official video`,
        `${trackName} ${artistName} music video`,
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
    const description = result.description.toLowerCase();
    const track = trackName.toLowerCase();
    const artist = artistName.toLowerCase();

    // Exact matches in title (highest priority)
    if (title.includes(track)) score += 20;
    if (title.includes(artist)) score += 20;

    // Partial word matches in title
    const trackWords = track.split(/\s+/).filter(word => word.length > 2);
    const artistWords = artist.split(/\s+/).filter(word => word.length > 2);

    trackWords.forEach(word => {
      if (title.includes(word)) score += 5;
    });

    artistWords.forEach(word => {
      if (title.includes(word)) score += 5;
      if (channel.includes(word)) score += 8; // Artist name in channel is good
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

  // Utility method to validate API key format
  isValidApiKey(key: string): boolean {
    // YouTube API keys are typically 39 characters long and contain alphanumeric characters and hyphens/underscores
    return /^[A-Za-z0-9_-]{35,45}$/.test(key);
  }

  // Test the API connection
  async testConnection(): Promise<boolean> {
    try {
      await this.searchVideos('test', 1);
      return true;
    } catch (error) {
      console.error('YouTube API connection test failed:', error);
      return false;
    }
  }
}

export const youtubeService = new YouTubeService();