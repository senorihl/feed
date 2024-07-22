import { CompositeScreenProps } from "@react-navigation/native";
import React from "react";
import color from "color";
import {
  FeedStackParamList,
  RootTabParamList,
  useAppSelector,
  useLinkOpener,
} from "../../store/hooks";
import { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import { useGetFeedQuery } from "../../store/reducers/feed";
import {
  ActivityIndicator,
  Card,
  Chip,
  Paragraph,
  Title,
  useTheme,
} from "react-native-paper";
import { useCalendars } from "expo-localization";
import type { CombinedThemeType } from "../../../App";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RefreshControl, FlatList, ScrollView, View } from "react-native";
import { i18n } from "../../translations";
import { FlashList } from "@shopify/flash-list";

type FeedScreenProps = CompositeScreenProps<
  NativeStackScreenProps<FeedStackParamList, "Feed">,
  BottomTabScreenProps<RootTabParamList>
>;

export const Feed: React.FC<FeedScreenProps> = ({ route }) => {
  const theme = useTheme() as CombinedThemeType;
  const locale = useAppSelector((state) => state.configuration.locale || "en");
  const cal = useCalendars();
  const onItemPressed = useLinkOpener();
  const { data, isFetching, isLoading, refetch } = useGetFeedQuery(
    route.params.url
  );

  return (
    <FlashList
      data={data?.items}
      estimatedItemSize={350}
      refreshControl={
        <RefreshControl
          title={
            isFetching || isLoading
              ? i18n.t("feed.refreshing")
              : i18n.t("feed.refresh")
          }
          refreshing={isFetching || isLoading}
          onRefresh={() => {
            refetch();
          }}
        />
      }
      keyExtractor={(item) => `item-card-${route.params.url}-${item.link}`}
      renderItem={({ item, index }) => {
        return (
          <Card
            style={{ marginVertical: 10, marginHorizontal: 10 }}
            onPress={() => {
              onItemPressed(item.link);
            }}
          >
            {item.media && (
              <Card.Cover
                source={{ uri: item.media.url }}
                style={{
                  borderBottomLeftRadius: 0,
                  borderBottomRightRadius: 0,
                }}
              />
            )}
            <Chip
              textStyle={{
                color: color(theme.colors.onSurface)
                  .lighten(3)
                  .rgb()
                  .toString(),
              }}
              style={{
                borderTopLeftRadius: item.media ? 0 : void 0,
                borderTopRightRadius: item.media ? 0 : void 0,
                borderBottomLeftRadius: 0,
                borderBottomRightRadius: 0,
                backgroundColor: color(theme.colors.surfaceDisabled)
                  .lighten(5)
                  .rgb()
                  .toString(),
              }}
            >
              {Intl.DateTimeFormat(locale, {
                dateStyle: "medium",
                timeStyle: "short",
                timeZone: cal[0].timeZone,
              }).format(Date.parse(item.updated))}
            </Chip>
            <Card.Content style={{ marginVertical: 20 }}>
              <Title>{item.title}</Title>
              <Paragraph>{item.description}</Paragraph>
            </Card.Content>
            <Chip
              style={{
                borderTopLeftRadius: 0,
                borderTopRightRadius: 0,
                borderBottomLeftRadius: item.media ? 0 : void 0,
                borderBottomRightRadius: item.media ? 0 : void 0,
                backgroundColor: color(theme.colors.surfaceDisabled)
                  .lighten(5)
                  .rgb()
                  .toString(),
              }}
              textStyle={{
                color: color(theme.colors.onSurface)
                  .lighten(3)
                  .rgb()
                  .toString(),
              }}
            >
              {data.title}
            </Chip>
          </Card>
        );
      }}
      ListEmptyComponent={() => {
        return isFetching || isLoading ? (
          <Paragraph style={{ alignSelf: "center" }}>
            {i18n.t("feed.refreshing")}
          </Paragraph>
        ) : (
          <Paragraph style={{ alignSelf: "center" }}>
            {i18n.t("feed.empty")}
          </Paragraph>
        );
      }}
      ListFooterComponentStyle={{ marginVertical: 5 }}
      ListFooterComponent={() => {
        return (
          <View
            style={{
              flex: 1,
              alignItems: "center",
            }}
          >
            {data?.updated && (
              <Paragraph>
                {i18n.t("feed.lastContentOn", {
                  date: Intl.DateTimeFormat(locale, {
                    dateStyle: "medium",
                    timeStyle: "short",
                    timeZone: cal[0].timeZone,
                  }).format(Date.parse(data.updated)),
                })}
              </Paragraph>
            )}
            {data?.lastFetch && (
              <Paragraph>
                {i18n.t("feed.updatedOn", {
                  date: Intl.DateTimeFormat(locale, {
                    dateStyle: "medium",
                    timeStyle: "short",
                    timeZone: cal[0].timeZone,
                  }).format(Date.parse(data.lastFetch)),
                })}
              </Paragraph>
            )}
          </View>
        );
      }}
    />
  );
};
