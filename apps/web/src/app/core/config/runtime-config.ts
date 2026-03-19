declare global {
  interface Window {
    __SKILLS_TRACKER_CONFIG__?: {
      apiBaseUrl?: string;
    };
  }
}

window.__SKILLS_TRACKER_CONFIG__ = {
  ...(window.__SKILLS_TRACKER_CONFIG__ ?? {}),
};

export function getRuntimeApiBaseUrl(): string {
  return window.__SKILLS_TRACKER_CONFIG__?.apiBaseUrl?.trim() || '/api';
}
