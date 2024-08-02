const googlePlist = process.env.GOOGLE_SERVICES_PLIST_FILE || './GoogleService-Info.plist';
const googleJson = process.env.GOOGLE_SERVICES_FILE || './google-services.json';

module.exports = {
  "expo": {
    "name": "Feed",
    "runtimeVersion": {
      "policy": "fingerprint"
    },
    "slug": "feed",
    "scheme": "feed-reader",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "userInterfaceStyle": "light",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#F7F5FB"
    },
    "updates": {
      "fallbackToCacheTimeout": 0,
      "url": "https://u.expo.dev/a120e0dd-5a5c-48d4-867e-5c62bc8f9eb8"
    },
    "assetBundlePatterns": ["**/*"],
    "ios": {
      "supportsTablet": true,
      "infoPlist": {
        "UIBackgroundModes": ["fetch", "remote-notification", "processing"]
      },
      "bundleIdentifier": "com.senorihl.feed",
      "googleServicesFile": googlePlist,
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#F7F5FB"
      },
      "package": "com.senorihl.feed",
      "googleServicesFile": googleJson,
    },
    "web": {
      "favicon": "./assets/favicon.png",
      "bundler": "metro"
    },
    "extra": {
      "eas": {
        "projectId": "a120e0dd-5a5c-48d4-867e-5c62bc8f9eb8"
      }
    },
    "plugins": [
      [
        "expo-build-properties",
        {
          "ios": {
            "useFrameworks": "static"
          }
        }
      ],
      "expo-localization",
      [
        "expo-font",
        {
          "fonts": []
        }
      ],
      "expo-router",
      "@react-native-firebase/app",
      "@react-native-firebase/crashlytics",
    ]
  }
}
