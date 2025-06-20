interface LrcLibTrack {
  id: number;
  name: string;
  trackName: string;
  artistName: string;
  albumName: string;
  duration: number;
  instrumental: boolean;
  plainLyrics: string | null;
  syncedLyrics: string | null;
  lang?: string;
  isrc?: string;
  spotify_id?: string;
  release_date?: string;
}

interface SearchParams {
  trackName: string;
  artistName: string;
  albumName?: string;
}

export class LyricsService {
  private readonly baseUrl = 'https://lrclib.net/api';
  private readonly userAgent = 'TypeMusic/1.0';
  private cache = new Map<string, LrcLibTrack>();

  private getCacheKey(params: SearchParams): string {
    return `${params.artistName}-${params.trackName}`.toLowerCase();
  }

  async searchLyrics(params: SearchParams): Promise<LrcLibTrack[]> {
    const cacheKey = this.getCacheKey(params);
    
    // Check cache first
    if (this.cache.has(cacheKey)) {
      const cachedTrack = this.cache.get(cacheKey)!;
      return [cachedTrack];
    }

    const searchParams = new URLSearchParams({
      track_name: params.trackName,
      artist_name: params.artistName
    });

    if (params.albumName) {
      searchParams.append('album_name', params.albumName);
    }

    try {
      const response = await fetch(`${this.baseUrl}/search?${searchParams}`, {
        headers: {
          'User-Agent': this.userAgent
        }
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }

      const data: LrcLibTrack[] = await response.json();
      
      // Cache the first result if available
      if (data.length > 0) {
        this.cache.set(cacheKey, data[0]);
      }

      return data;
    } catch (error) {
      console.error('Failed to fetch lyrics:', error);
      throw error;
    }
  }

  async getLyrics(params: SearchParams): Promise<string | null> {
    try {
      const tracks = await this.searchLyrics(params);
      
      if (tracks.length === 0) {
        console.warn('No lyrics found for:', params);
        return null;
      }

      // Find the first track with synced lyrics
      const trackWithSyncedLyrics = tracks.find(track => track.syncedLyrics);
      if (trackWithSyncedLyrics?.syncedLyrics) {
        return trackWithSyncedLyrics.syncedLyrics;
      }

      // Fallback to plain lyrics if no synced lyrics available
      const trackWithPlainLyrics = tracks.find(track => track.plainLyrics);
      if (trackWithPlainLyrics?.plainLyrics) {
        console.warn('Only plain lyrics available, no synced lyrics found');
        return trackWithPlainLyrics.plainLyrics;
      }

      console.warn('No lyrics (synced or plain) found for:', params);
      return null;
    } catch (error) {
      console.error('Error getting lyrics:', error);
      return null;
    }
  }

  // Convert plain lyrics to basic LRC format with default timing
  private convertPlainToLrc(plainLyrics: string): string {
    const lines = plainLyrics.split('\n').filter(line => line.trim());
    let lrcContent = '[00:00.00]\n'; // Start with empty line
    
    // Add each line with 4-second intervals
    lines.forEach((line, index) => {
      const minutes = Math.floor((index + 1) * 4 / 60);
      const seconds = ((index + 1) * 4) % 60;
      const timestamp = `[${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.00]`;
      lrcContent += `${timestamp}${line.trim()}\n`;
    });

    return lrcContent;
  }

  async getLrcFormatLyrics(params: SearchParams): Promise<string | null> {
    const lyrics = await this.getLyrics(params);
    
    if (!lyrics) {
      return null;
    }

    // If lyrics already contain timestamps, return as-is
    if (lyrics.includes('[') && lyrics.includes(']')) {
      return lyrics;
    }

    // Convert plain lyrics to basic LRC format
    return this.convertPlainToLrc(lyrics);
  }

  clearCache(): void {
    this.cache.clear();
  }
}

// Export singleton instance
export const lyricsService = new LyricsService();