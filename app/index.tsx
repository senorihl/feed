import { ScrollView } from "react-native";
import { useAppSelector } from "../src/store/hooks";
import Icon from "@expo/vector-icons/MaterialCommunityIcons";
import {
  ActivityIndicator,
  Button,
  List as PaperList,
  Text,
} from "react-native-paper";
import { useLazyGetFeedQuery } from "../src/store/reducers/feed";
import React from "react";
import { useCalendars } from "expo-localization";
import { router } from "expo-router";
import { i18n } from "../src/translations";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function Titles() {
  const { bottom } = useSafeAreaInsets();
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
    <ScrollView contentContainerStyle={{ paddingBottom: bottom }}>
      {Object.entries(feeds).map(
        ([url, { title, updated, lastUpdated, customName }]) => {
          if (!updated || !title || !url) {
            return <></>;
          }
          return (
            <PaperList.Item
              key={`config-feed-${url}`}
              title={customName || title}
              description={(props) => {
                let descriptionNumberOfLines = 1;
                let description = i18n.t("feed.updatedOn", {
                  date: Intl.DateTimeFormat(locale, {
                    dateStyle: "medium",
                    timeStyle: "short",
                    timeZone: cal[0].timeZone,
                  }).format(Date.parse(updated)),
                });

                if (typeof lastUpdated !== "undefined") {
                  descriptionNumberOfLines++;
                  description +=
                    "\n" +
                    i18n.t("feed.lastContentOn", {
                      date: Intl.DateTimeFormat(locale, {
                        dateStyle: "medium",
                        timeStyle: "short",
                        timeZone: cal[0].timeZone,
                      }).format(Date.parse(lastUpdated)),
                    });
                }

                return (
                  <Text
                    selectable={props.selectable}
                    numberOfLines={descriptionNumberOfLines}
                    ellipsizeMode={props.ellipsizeMode}
                    style={{ color: props.color, fontSize: props.fontSize }}
                  >
                    {description}
                  </Text>
                );
              }}
              disabled={refreshList[url] && refreshList[url] === true}
              right={(props) =>
                refreshList[url] && refreshList[url] === true ? (
                  <ActivityIndicator {...props} size={"small"} />
                ) : (
                  <PaperList.Icon icon="chevron-right" {...props} />
                )
              }
              onPress={() => {
                router.push({
                  pathname: "/feed/[url]",
                  params: { url: url, name: customName || title },
                });
              }}
            />
          );
        }
      )}
      {Object.keys(feeds).length > 0 ? (
        <Button
          icon={"refresh"}
          onPress={triggerRefresh}
          style={{ marginTop: 20, alignSelf: "center" }}
        >
          {i18n.t("feed.updateAll")}
        </Button>
      ) : (
        <Button
          icon={"plus-circle"}
          onPress={() => {
            router.push({
              pathname: "settings",
              params: { addFeedOpened: "" },
            });
          }}
          style={{ marginTop: 20, alignSelf: "center" }}
        >
          {i18n.t("settings.addFeed")}
        </Button>
      )}
    </ScrollView>
  );
}
