import { createSlice, PayloadAction, createAsyncThunk } from "@reduxjs/toolkit";
import * as Crypto from "expo-crypto";
import firebase from "@react-native-firebase/app";
import { feedApi } from "./feed";
import { i18n } from "../../translations";
import firestore from "@react-native-firebase/firestore";

export type ConfigurationInterface = {
  installationId: string;
  pushToken?: string;
  locale?: string;
  appearenceMode?: "light" | "dark";
  openLinksMode?: "out" | "in";
  feeds?: {
    [url: string]: {
      title: string;
      updated: string;
      lastUpdated?: string;
      icon?: string;
      customName?: string;
    };
  };
};

const initialState: ConfigurationInterface = {
  feeds: {},
  installationId: Crypto.randomUUID(),
};

export const addFeed = createAsyncThunk(
  "addFeed",
  async (
    url: string,
    { fulfillWithValue, rejectWithValue, dispatch, getState, extra }
  ) => {
    try {
      const feed = await feedApi.endpoints.getFeed
        .initiate(url, { forceRefetch: true })(dispatch, getState, extra)
        .unwrap();
      if (feed) {
        return [
          feed.url,
          feed.title || feed.url,
          feed.lastFetch,
          feed.items.at(0)?.updated,
        ] as [
          url: string,
          title: string,
          date: string,
          lastUpdated: string | undefined
        ];
      }
    } catch (e) {
      console.warn(e);
      throw e;
    }
  }
);

export const addOPML = createAsyncThunk(
  "addOPML",
  async (
    url: string,
    { fulfillWithValue, rejectWithValue, dispatch, getState, extra }
  ) => {
    try {
      const feeds = await feedApi.endpoints.getOPML
        .initiate(url, { forceRefetch: true })(dispatch, getState, extra)
        .unwrap();

      if (feeds) {
        return feeds.map((feed) => {
          return [
            feed.url,
            feed.title || feed.url,
            feed.lastFetch,
            feed.items.at(0)?.updated,
          ] as [
            url: string,
            title: string,
            date: string,
            lastUpdated: string | undefined
          ];
        });
      }
    } catch (e) {
      console.warn(e);
      throw e;
    }
  }
);

const configurationSlice = createSlice({
  name: "configuration",
  initialState,
  reducers: {
    saveInstallationId(state, action: PayloadAction) {
      state.installationId = state.installationId || Crypto.randomUUID();
    },
    savePushToken(
      state,
      action: PayloadAction<{
        token: string | null;
        nativeToken: string | null;
      }>
    ) {
      state.installationId = state.installationId || Crypto.randomUUID();
      state.pushToken = action.payload.token;
      firebase
        .firestore()
        .collection("push_tokens")
        .doc(state.installationId)
        .set({
          token: action.payload.token,
          nativeToken: action.payload.nativeToken,
          updatedAt: firestore.FieldValue.serverTimestamp(),
        });
    },
    saveAppearenceMode(
      state,
      action: PayloadAction<undefined | "light" | "dark">
    ) {
      state.appearenceMode = action.payload;
    },
    saveLinksMode(state, action: PayloadAction<"in" | "out">) {
      state.openLinksMode = action.payload;
    },
    saveLocale(state, action: PayloadAction<(typeof i18n)["defaultLocale"]>) {
      state.locale = action.payload;
      i18n.locale = state.locale;
    },
    updateFeedFetchDate(
      state,
      action: PayloadAction<
        [url: string, ts: string, lastUpdated: string | undefined]
      >
    ) {
      if (state.feeds[action.payload[0]]) {
        state.feeds[action.payload[0]].updated = action.payload[1];
        state.feeds[action.payload[0]].lastUpdated = action.payload[2];
      }
    },
    removeFeed(state, action: PayloadAction<string>) {
      if (typeof state.feeds[action.payload] !== "undefined") {
        delete state.feeds[action.payload];
      }
    },
    renameFeed(
      state,
      action: PayloadAction<{ url: string; name: string | undefined }>
    ) {
      if (typeof state.feeds[action.payload.url] !== "undefined") {
        state.feeds[action.payload.url].customName = action.payload.name;
      }
    },
  },
  extraReducers: (builder) => {
    builder.addCase(addFeed.fulfilled, (state, action) => {
      const [url, title, updated, lastUpdated] = action.payload;
      state.feeds[url] = { title, updated, lastUpdated };
    });
    builder.addCase(addOPML.fulfilled, (state, action) => {
      const feeds = action.payload;
      feeds.forEach(([url, title, updated, lastUpdated]) => {
        state.feeds[url] = { title, updated, lastUpdated };
      });
    });
  },
});

export const {
  savePushToken,
  saveInstallationId,
  saveAppearenceMode,
  saveLinksMode,
  saveLocale,
  updateFeedFetchDate,
  removeFeed,
  renameFeed,
} = configurationSlice.actions;
export const { name } = configurationSlice;
export default configurationSlice.reducer;
