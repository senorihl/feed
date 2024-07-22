import { I18n } from "i18n-js";

export type Translation = {
  global: {
    enable: string;
    disable: string;
    enabled: string;
    disabled: string;
  };
  screens: {
    settings: string;
    feeds: string;
  };
  settings: {
    preferences: string;
    darkMode: string;
    locale: string;
    "darkMode-auto": string;
    feeds: string;
    addFeed: string;
    clearCache: string;
    openLinksWithinApp: string;
    popin: {
      feedUrl: string;
      feedUrlHelper: string;
      feedUrlError: string;
    };
  };

  feed: {
    lastContentOn: string;
    updatedOn: string;
    updateAll: string;
    refreshing: string;
    refresh: string;
  };
};

import { en } from "./en";
import { fr } from "./fr";
import { es } from "./es";

export const i18n = new I18n({
  en,
  fr,
  es,
});

i18n.defaultLocale = "en";
i18n.enableFallback = true;
