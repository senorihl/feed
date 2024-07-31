import { router, Stack } from "expo-router";
import React from "react";
import { StatusBar } from "expo-status-bar";
import { PersistGate } from "redux-persist/integration/react";
import * as SplashScreen from "expo-splash-screen";
import * as Font from "expo-font";
import { SQLiteProvider } from "expo-sqlite";
import * as NavigationBar from "expo-navigation-bar";
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
import { DATABASE_NAME, migrateDbIfNeeded } from "../src/services/database";
import "../src/services/background";

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

export default function Layout() {
  const [loaded, error] = Font.useFonts({});
  const routeNameRef = React.useRef<string>();
  const scheme = useColorScheme();
  const [state, dispatch] = React.useReducer(reducer, initialState);
  const [appearenceMode, setAppearenceMode] = React.useState(scheme);

  const onLayoutRootView = React.useCallback(async () => {
    await SplashScreen.hideAsync();
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
          <SQLiteProvider
            databaseName={DATABASE_NAME}
            onInit={migrateDbIfNeeded}
          >
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
          </SQLiteProvider>
        </PersistGate>
      </StoreProvider>
      <StatusBar style={appearenceMode === "dark" ? "light" : "dark"} />
    </>
  );
}
