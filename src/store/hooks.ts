import {
  NavigationProp,
  RouteProp,
  useNavigation,
  useRoute,
  NavigatorScreenParams,
} from "@react-navigation/native";
import { useColorScheme } from "react-native";
import { TypedUseSelectorHook, useDispatch, useSelector } from "react-redux";
import * as Linking from "expo-linking";
import * as WebBrowser from "expo-web-browser";

export type FeedStackParamList = {
  List: undefined;
  Feed: { url: string; title: string };
};

export type RootTabParamList = {
  Settings: undefined;
  Feeds: NavigatorScreenParams<FeedStackParamList>;
};

import type { AppState, AppDispatch } from "./";
import React from "react";

export const useAppNavigation = () =>
  useNavigation<NavigationProp<RootTabParamList>>();
export const useAppRoute = () => useRoute<RouteProp<RootTabParamList>>();
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<AppState> = useSelector;
export const useAppColorScheme = () => {
  const scheme = useColorScheme();
  const appearenceMode = useAppSelector(
    (state) => state.configuration.appearenceMode || scheme
  );
  return appearenceMode;
};

export const useLinkOpener = () => {
  const openLinksMode = useAppSelector(
    (state) => state.configuration.openLinksMode || "in"
  );
  return React.useCallback(
    (url: string) => {
      if (openLinksMode === "in") {
        WebBrowser.openBrowserAsync(url).catch((e) => {
          console.debug(e);
          return Linking.openURL(url);
        });
      } else {
        Linking.openURL(url).catch(console.debug);
      }
    },
    [openLinksMode]
  );
};
