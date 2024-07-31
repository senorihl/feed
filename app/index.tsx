import { ScrollView } from "react-native";
import { useAppSelector } from "../src/store/hooks";
import Icon from "@expo/vector-icons/MaterialCommunityIcons";
import {
  ActivityIndicator,
  Button,
  List as PaperList,
} from "react-native-paper";
import { useLazyGetFeedQuery } from "../src/store/reducers/feed";
import React from "react";
import { useCalendars } from "expo-localization";
import { router } from "expo-router";
import { i18n } from "../src/translations";

export default function Titles() {
  const [trigger] = useLazyGetFeedQuery();
  const [refreshList, dispatchRefresh] = React.useReducer(
    (
      state: { [url: string]: boolean },
      action: [url: string, isRefreshing: boolean]
    ) => {
      const newState = { ...state };
      newState[action[0]] = action[1];
      return newState;
    },
    {}
  );
  const feeds = useAppSelector((state) => state.configuration.feeds || {});
  const locale = useAppSelector((state) => state.configuration.locale || "en");
  const cal = useCalendars();

  const triggerRefresh = React.useCallback(async () => {
    const urls = Object.keys(feeds);
    for (let i = 0; i < urls.length; i++) {
      const url = urls[i];
      dispatchRefresh([url, true]);
      trigger(url).finally(() => {
        dispatchRefresh([url, false]);
      });
    }
  }, [feeds]);

  return (
    <ScrollView>
      {Object.entries(feeds).map(([url, { title, updated }]) => {
        if (!updated || !title || !url) {
          return <></>;
        }
        return (
          <PaperList.Item
            key={`config-feed-${url}`}
            title={title}
            description={
              updated
                ? i18n.t("feed.updatedOn", {
                    date: Intl.DateTimeFormat(locale, {
                      dateStyle: "medium",
                      timeStyle: "short",
                      timeZone: cal[0].timeZone,
                    }).format(Date.parse(updated)),
                  })
                : void 0
            }
            disabled={refreshList[url] && refreshList[url] === true}
            right={(props) =>
              refreshList[url] && refreshList[url] === true ? (
                <ActivityIndicator {...props} size={"small"} />
              ) : (
                <Icon name="chevron-right" {...props} size={20} />
              )
            }
            onPress={() => {
              router.push({
                pathname: "/feed/[url]",
                params: { url: url, name: title },
              });
            }}
          />
        );
      })}
      <Button icon={"refresh"} onPress={triggerRefresh}>
        {i18n.t("feed.updateAll")}
      </Button>
    </ScrollView>
  );
}
