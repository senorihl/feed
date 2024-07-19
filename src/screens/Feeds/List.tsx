import * as React from "react";
import {
  FeedStackParamList,
  RootTabParamList,
  useAppSelector,
} from "../../store/hooks";
import { ScrollView } from "react-native";
import {
  ActivityIndicator,
  Button,
  List as PaperList,
} from "react-native-paper";
import { MaterialCommunityIcons as Icon } from "@expo/vector-icons";
import { useCalendars } from "expo-localization";
import { CompositeScreenProps } from "@react-navigation/native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import { i18n } from "../../translations";
import { useLazyGetFeedQuery } from "../../store/reducers/feed";

type ListScreenProps = CompositeScreenProps<
  NativeStackScreenProps<FeedStackParamList, "List">,
  BottomTabScreenProps<RootTabParamList>
>;

export const List: React.FC<ListScreenProps> = ({ navigation }) => {
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
      <PaperList.Section>
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
                navigation.push("Feed", { url, title });
              }}
            />
          );
        })}
      </PaperList.Section>
      <Button icon={"refresh"} onPress={triggerRefresh}>
        {i18n.t("feed.updateAll")}
      </Button>
    </ScrollView>
  );
};
