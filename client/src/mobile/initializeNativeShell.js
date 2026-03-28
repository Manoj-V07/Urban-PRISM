import { Capacitor } from "@capacitor/core";
import { App as CapacitorApp } from "@capacitor/app";
import { Keyboard, KeyboardResize } from "@capacitor/keyboard";
import { SplashScreen } from "@capacitor/splash-screen";
import { StatusBar, Style } from "@capacitor/status-bar";

const isNative = Capacitor.isNativePlatform();

const tryCall = async (fn) => {
  try {
    await fn();
  } catch {
    // Keep startup resilient if a plugin call fails on a platform.
  }
};

export const initializeNativeShell = async () => {
  if (!isNative) return;

  document.documentElement.classList.add("native-mobile-app");
  document.body.classList.add("native-mobile-app");

  await tryCall(() => StatusBar.setOverlaysWebView({ overlay: false }));
  await tryCall(() => StatusBar.setStyle({ style: Style.Dark }));

  await tryCall(() =>
    Keyboard.setResizeMode({
      mode: KeyboardResize.Body,
    })
  );

  let lastBackPress = 0;
  await tryCall(() =>
    CapacitorApp.addListener("backButton", ({ canGoBack }) => {
      if (canGoBack) {
        window.history.back();
        return;
      }

      const now = Date.now();
      if (now - lastBackPress < 1500) {
        CapacitorApp.exitApp();
      } else {
        lastBackPress = now;
      }
    })
  );

  await tryCall(() => SplashScreen.hide());
};
