import { router, Stack, useGlobalSearchParams, usePathname } from "expo-router";
import React from "react";
import { StatusBar } from "expo-status-bar";
import { PersistGate } from "redux-persist/integration/react";
import * as SplashScreen from "expo-splash-screen";
import * as Font from "expo-font";
import * as NavigationBar from "expo-navigation-bar";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import Constants from "expo-constants";
import Icon from "@expo/vector-icons/MaterialCommunityIcons";
import {
  StyleSheet,
  View,
  useColorScheme,
  Platform,
  TouchableOpacity,
} from "react-native";
import {
  Provider as PaperProvider,
  MD3DarkTheme,
  MD3LightTheme,
} from "react-native-paper";
import { Provider as StoreProvider } from "react-redux";
import store, { persistor } from "../src/store";
import "../src/services/background";
import firebase from "@react-native-firebase/app";
import "@react-native-firebase/analytics";
import "@react-native-firebase/crashlytics";
import "@react-native-firebase/firestore";
import "@react-native-firebase/messaging";
import {
  NOTIFICATION_FETCH_TASK,
  onNotification,
} from "../src/services/background";
import { savePushToken } from "../src/store/reducers/configuration";

type ReducerInitialState = {
  store: boolean;
  font: boolean;
};

const initialState: ReducerInitialState = {
  store: false,
  font: false,
};

type ReducerAction = { type: "STORE" } | { type: "FONT" };

const reducer: React.Reducer<ReducerInitialState, ReducerAction> = (
  state,
  action
) => {
  switch (action.type) {
    case "STORE":
      return { ...state, store: true };
    case "FONT":
      return { ...state, font: true };
    default:
      throw new Error();
  }
};

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

Notifications.registerTaskAsync(NOTIFICATION_FETCH_TASK);

firebase.messaging().setBackgroundMessageHandler(async remoteMessage => {
  firebase.analytics().logEvent("fnotification", {data: remoteMessage.data});
});

Notifications.setNotificationHandler({
  handleNotification: async (notification) => {
    onNotification(notification.request.content.data);

    return {
      shouldShowAlert: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    };
  },
});

export default function Layout() {
  const [loaded, error] = Font.useFonts({});
  const scheme = useColorScheme();
  const pathname = usePathname();
  const params = useGlobalSearchParams();
  const [state, dispatch] = React.useReducer(reducer, initialState);
  const [appearenceMode, setAppearenceMode] = React.useState(scheme);

  React.useEffect(() => {
    firebase.analytics().logScreenView({
      screen_class: pathname,
      screen_name: pathname,
      ...params,
    });
  }, [pathname, params]);

  const onLayoutRootView = React.useCallback(async () => {
    await SplashScreen.hideAsync();
    firebase.analytics().logAppOpen();
    const token = await registerForPushNotificationsAsync();

    if (token) {
      store.dispatch(savePushToken({ token }));
    }
  }, []);

  React.useEffect(() => {
    if (Platform.OS === "android") {
      NavigationBar.setBackgroundColorAsync(
        appearenceMode === "dark"
          ? MD3DarkTheme.colors.background
          : MD3LightTheme.colors.background
      );
      NavigationBar.setButtonStyleAsync(
        appearenceMode === "dark" ? "light" : "dark"
      );
      NavigationBar.setBorderColorAsync(
        appearenceMode === "dark"
          ? MD3DarkTheme.colors.background
          : MD3LightTheme.colors.background
      );
    }
  }, [appearenceMode]);

  React.useEffect(() => {
    if (loaded || error) {
      dispatch({ type: "FONT" });
    }
  }, [loaded, error]);

  const onStoreRehydrated = () => {
    setAppearenceMode(store.getState().configuration.appearenceMode || scheme);
    dispatch({ type: "STORE" });
  };

  React.useEffect(() => {
    const tearDown = store.subscribe(() => {
      // @ts-ignore
      if (store.getState()._persist.rehydrated) {
        onStoreRehydrated();
        tearDown();
      }
    });

    const tearDownScheme = store.subscribe(() => {
      setAppearenceMode(
        store.getState().configuration.appearenceMode || scheme
      );
    });

    // @ts-ignore
    if (store.getState()._persist.rehydrated) {
      onStoreRehydrated();
    }

    return () => {
      tearDown();
      tearDownScheme();
    };
  }, [scheme]);

  return (
    <>
      <StoreProvider store={store}>
        <PersistGate loading={null} persistor={persistor}>
          {state.store && state.font && (
            <PaperProvider
              theme={appearenceMode === "dark" ? MD3DarkTheme : MD3LightTheme}
            >
              <View
                onLayout={onLayoutRootView}
                style={[StyleSheet.absoluteFill]}
              >
                <Stack initialRouteName="index" screenOptions={{}}>
                  <Stack.Screen
                    name="index"
                    options={{
                      title: "Feeds",
                      headerRight(props) {
                        return (
                          <TouchableOpacity
                            onPress={() => router.push("settings")}
                          >
                            <Icon
                              size={20}
                              name="cog"
                              color={props.tintColor}
                            />
                          </TouchableOpacity>
                        );
                      },
                    }}
                  />
                  <Stack.Screen
                    name="feed/[url]"
                    options={({
                      route: {
                        params: { name },
                      },
                    }) => {
                      return { title: name };
                    }}
                  />
                  <Stack.Screen
                    name="settings"
                    options={{
                      title: "Settings",
                    }}
                  />
                </Stack>
              </View>
            </PaperProvider>
          )}
        </PersistGate>
      </StoreProvider>
      <StatusBar style={appearenceMode === "dark" ? "light" : "dark"} />
    </>
  );
}

async function registerForPushNotificationsAsync() {
  let token;

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#FF231F7C",
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== "granted") {
      alert("Failed to get push token for push notification!");
      return;
    }
    // Learn more about projectId:
    // https://docs.expo.dev/push-notifications/push-notifications-setup/#configure-projectid
    // EAS projectId is used here.
    try {
      const projectId =
        Constants?.expoConfig?.extra?.eas?.projectId ??
        Constants?.easConfig?.projectId;
      if (!projectId) {
        throw new Error("Project ID not found");
      }
      token = (
        await Notifications.getExpoPushTokenAsync({
          projectId,
        })
      ).data;
      console.log(token);
    } catch (e) {
      token = `${e}`;
    }
  }

  return token;
}
