import { configureStore, Middleware } from "@reduxjs/toolkit";
import { persistStore, persistReducer } from "redux-persist";
import {
  FLUSH,
  REHYDRATE,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
} from "redux-persist";
import AsyncStorage from "@react-native-async-storage/async-storage";
import rootReducer from "./reducers";
import { feedApi } from "./reducers/feed";
import { i18n } from "../translations";

const persistConfig = {
  key: "@redux-store",
  storage: AsyncStorage,
  debug: true,
  version: 1,
};

const i18nMiddleware: Middleware = (api) => (next) => (action) => {
  next(action);
  if (action.type === "persist/REHYDRATE") {
    i18n.locale = api.getState()?.configuration?.locale || i18n.defaultLocale;
  }
};

const store = configureStore({
  devTools: __DEV__,
  reducer: persistReducer(persistConfig, rootReducer) as typeof rootReducer,
  middleware: (getDefaultMiddleware) => {
    return getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    })
      .concat(feedApi.middleware)
      .concat(i18nMiddleware);
  },
});

export const persistor = persistStore(store);

export type AppState = ReturnType<typeof store.getState>;

export type AppDispatch = typeof store.dispatch;

export default store;
