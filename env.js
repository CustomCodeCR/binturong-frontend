type RuntimeConfig = {
  VITE_APP_VERSION?: string;
  VITE_API_URL?: string;
  VITE_API_VERSION?: string;
  VITE_APP_NAME?: string;
  VITE_FRONTEND_DOMAIN?: string;
};

declare global {
  interface Window {
    __APP_CONFIG__?: RuntimeConfig;
  }
}

export const env = {
  appVersion:
    window.__APP_CONFIG__?.VITE_APP_VERSION ??
    import.meta.env.VITE_APP_VERSION,

  apiUrl:
    window.__APP_CONFIG__?.VITE_API_URL ??
    import.meta.env.VITE_API_URL,

  apiVersion:
    window.__APP_CONFIG__?.VITE_API_VERSION ??
    import.meta.env.VITE_API_VERSION,

  appName:
    window.__APP_CONFIG__?.VITE_APP_NAME ??
    import.meta.env.VITE_APP_NAME,

  frontendDomain:
    window.__APP_CONFIG__?.VITE_FRONTEND_DOMAIN ??
    import.meta.env.VITE_FRONTEND_DOMAIN,
};
