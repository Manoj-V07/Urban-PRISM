# Mobile App Guide (Capacitor)

This project is now configured to run as a native Android app using Capacitor, while reusing the current React frontend.

## What Was Added

- Capacitor core + Android platform integration in the client app.
- Native shell initialization for status bar, keyboard resize, splash hide, and Android back button handling.
- Mobile build scripts in `client/package.json`.
- Android project scaffold in `client/android/`.

## Prerequisites (Windows)

- Node.js 18+
- Android Studio (latest stable)
- Android SDK + platform tools
- Java 21 (required by current Capacitor Android toolchain)

## One-Time Setup

1. Install dependencies:

```bash
cd client
npm install
```

2. Build and sync web assets to Android project:

```bash
npm run mobile:sync
```

3. Configure Android SDK path for Gradle (required before `assembleDebug`):

- If Android SDK is installed at `C:\Users\<you>\AppData\Local\Android\Sdk`, create `client/android/local.properties` with:

```properties
sdk.dir=C:\\Users\\<you>\\AppData\\Local\\Android\\Sdk
```

- Or set one of these environment variables globally:
  - `ANDROID_HOME`
  - `ANDROID_SDK_ROOT`

If Gradle reports `invalid source release: 21`, set Java 21 before building:

```powershell
$env:JAVA_HOME = "C:\Program Files\Android\Android Studio\jbr"
$env:Path = "$env:JAVA_HOME\bin;" + $env:Path
```

4. Open Android Studio project:

```bash
npm run mobile:open:android
```

## API Endpoint Configuration (Important)

Create `client/.env` (or copy from `client/.env.example`) and set:

```env
VITE_API_URL=https://urban-prism.onrender.com
VITE_NATIVE_API_URL=http://10.0.2.2:5000
```

Notes:

- `VITE_API_URL` is used in browser/web mode.
- `VITE_NATIVE_API_URL` is used by Capacitor native runtime.
- Android emulator should use `http://10.0.2.2:5000` for a backend running on your host machine.
- Real Android device must use your machine LAN IP (for example `http://192.168.1.20:5000`).

## Daily Development Workflow

After making frontend changes:

1. Build and sync:

```bash
npm run mobile:sync
```

2. In Android Studio:
- Select emulator/device
- Click Run

Alternative one-command run (device must be connected and configured):

```bash
npm run mobile:run:android
```

## Added Scripts

From `client`:

- `npm run mobile:copy` - Build + copy web assets to Android project
- `npm run mobile:sync` - Build + sync Capacitor config/plugins + assets
- `npm run mobile:open:android` - Open Android project in Android Studio
- `npm run mobile:android` - Build + sync + open Android Studio
- `npm run mobile:run:android` - Build + run on connected Android target

## Notes on UI Quality

- Existing responsive work is preserved.
- Native shell setup applies:
  - status bar integration
  - keyboard resize handling
  - native back button support
  - splash screen hide on startup
- For release readiness, validate key routes on a real device (small phone + large phone).

## Recommended Validation Checklist

- Authentication pages: Login/Register
- Main admin routes: Dashboard, Grievances, Map, Analytics, Assets, Workers, Tasks, SLA
- Field worker routes: My Tasks flow including proof upload
- Public tracking and feedback flow
- Sidebar open/close behavior across map and non-map pages
- Chatbot placement and non-overlap on narrow screens

## Build Release APK/AAB

Use Android Studio:

- Build > Generate Signed Bundle / APK
- Choose APK or Android App Bundle (AAB)
- Configure keystore and signing

For Play Store deployment, prefer AAB.
