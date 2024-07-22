import React from "react";
import { StatusBar } from "expo-status-bar";
import { PersistGate } from "redux-persist/integration/react";
import * as SplashScreen from "expo-splash-screen";
import * as Font from "expo-font";
import * as NavigationBar from "expo-navigation-bar";
import { StyleSheet, View, useColorScheme, Platform } from "react-native";
import {
  DarkTheme as NavigationDarkTheme,
  DefaultTheme as NavigationLightTheme,
  NavigationContainer,
  useNavigationContainerRef,
} from "@react-navigation/native";
import {
  Provider as PaperProvider,
  MD3DarkTheme,
  MD3LightTheme,
} from "react-native-paper";
import merge from "deepmerge";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { Provider as StoreProvider } from "react-redux";
import store, { persistor } from "./src/store";
import { Root } from "./src/screens/Root";

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

const CombinedDefaultTheme = merge(MD3LightTheme, NavigationLightTheme);
const CombinedDarkTheme = merge(MD3DarkTheme, NavigationDarkTheme);

export type CombinedThemeType = typeof CombinedDefaultTheme;

const App: React.FC = () => {
  const [loaded, error] = Font.useFonts({});
  const routeNameRef = React.useRef<string>();
  const navigationRef = useNavigationContainerRef();
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
          ? NavigationDarkTheme.colors.card
          : NavigationLightTheme.colors.card
      );
      NavigationBar.setButtonStyleAsync(
        appearenceMode === "dark" ? "light" : "dark"
      );
      NavigationBar.setBorderColorAsync(
        appearenceMode === "dark"
          ? NavigationDarkTheme.colors.border
          : NavigationLightTheme.colors.border
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
    <SafeAreaProvider>
      <StoreProvider store={store}>
        <PersistGate loading={null} persistor={persistor}>
          {state.store && state.font && (
            <NavigationContainer
              theme={
                appearenceMode === "dark"
                  ? CombinedDarkTheme
                  : CombinedDefaultTheme
              }
              ref={navigationRef}
              onReady={() => {
                routeNameRef.current = navigationRef.getCurrentRoute()?.name;
              }}
              onStateChange={async () => {
                const previousRouteName = routeNameRef.current;
                const currentRouteName = navigationRef.getCurrentRoute()?.name;

                if (previousRouteName !== currentRouteName) {
                  // Do something on route change
                }

                // Save the current route name for later comparison
                routeNameRef.current = currentRouteName;
              }}
            >
              <PaperProvider
                theme={
                  appearenceMode === "dark"
                    ? CombinedDarkTheme
                    : CombinedDefaultTheme
                }
              >
                <View
                  onLayout={onLayoutRootView}
                  style={[StyleSheet.absoluteFill]}
                >
                  <Root />
                </View>
              </PaperProvider>
            </NavigationContainer>
          )}
        </PersistGate>
      </StoreProvider>
      <StatusBar style={appearenceMode === "dark" ? "light" : "dark"} />
    </SafeAreaProvider>
  );
};

export default App;
