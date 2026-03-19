declare global {
  interface Window {
    __SKILLS_TRACKER_CONFIG__?: {
      apiBaseUrl?: string;
    };
  }
}

window.__SKILLS_TRACKER_CONFIG__ = {
  apiBaseUrl: 'http://127.0.0.1:3000',
  ...(window.__SKILLS_TRACKER_CONFIG__ ?? {}),
};

export function getRuntimeApiBaseUrl(): string {
  return window.__SKILLS_TRACKER_CONFIG__?.apiBaseUrl?.trim() || '/api';
}
