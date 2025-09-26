interface YouTubeSearchItem {
  id: {
    videoId: string;
  };
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
}

interface YouTubeAPIResponse {
  items: YouTubeSearchItem[];
  pageInfo: {
    totalResults: number;
    resultsPerPage: number;
  };
}

export const onRequestGet: PagesFunction = async (context) => {
  const { request, env } = context;
  const url = new URL(request.url);
  const query = url.searchParams.get('q');
  const maxResults = url.searchParams.get('maxResults') || '10';

  if (!query) {
    return new Response(JSON.stringify({ error: 'Query parameter required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const apiKey = env.YOUTUBE_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'YouTube API key not configured' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const youtubeUrl = new URL('https://www.googleapis.com/youtube/v3/search');
    youtubeUrl.searchParams.set('part', 'snippet');
    youtubeUrl.searchParams.set('q', query);
    youtubeUrl.searchParams.set('type', 'video');
    youtubeUrl.searchParams.set('maxResults', maxResults);
    youtubeUrl.searchParams.set('key', apiKey);

    const response = await fetch(youtubeUrl.toString());

    if (!response.ok) {
      if (response.status === 403) {
        return new Response(JSON.stringify({ error: 'YouTube API quota exceeded or invalid API key' }), {
          status: 403,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      throw new Error(`YouTube API error: ${response.status} ${response.statusText}`);
    }

    const data: YouTubeAPIResponse = await response.json();

    // Transform to match the expected format
    const transformedData = {
      items: data.items.map(item => ({
        videoId: item.id.videoId,
        title: item.snippet.title,
        channelTitle: item.snippet.channelTitle,
        description: item.snippet.description,
        thumbnails: item.snippet.thumbnails,
        publishedAt: item.snippet.publishedAt
      })),
      pageInfo: data.pageInfo
    };

    return new Response(JSON.stringify(transformedData), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
        'Access-Control-Allow-Headers': 'Content-Type'
      }
    });

  } catch (error) {
    console.error('YouTube API error:', error);
    return new Response(JSON.stringify({ error: 'Failed to search YouTube' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};