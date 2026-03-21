import { registerSW } from "virtual:pwa-register";

export const registerServiceWorker = () => {
  if (import.meta.env.DEV) {
    return;
  }

  registerSW({
    immediate: true,
    onRegisteredSW(swUrl) {
      console.info("Service worker registered:", swUrl);
    },
    onOfflineReady() {
      console.info("Urban-PRISM is ready for offline use.");
    },
  });
};
