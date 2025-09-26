interface Env {
  YOUTUBE_API_KEY: string;
}

interface PagesFunction {
  (context: {
    request: Request;
    env: Env;
    params: Record<string, string>;
    waitUntil: (promise: Promise<any>) => void;
    next: (input?: Request | string, init?: RequestInit) => Promise<Response>;
    data: Record<string, unknown>;
  }): Response | Promise<Response>;
}