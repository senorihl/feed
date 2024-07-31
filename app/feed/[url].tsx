import { Text, ScrollView, RefreshControl, View } from "react-native";
import { useAppSelector, useLinkOpener } from "../../src/store/hooks";
import { useGetFeedQuery } from "../../src/store/reducers/feed";
import { useLocalSearchParams } from "expo-router";
import { FlashList } from "@shopify/flash-list";
import { i18n } from "../../src/translations";
import { Card, Chip, Paragraph, Title, useTheme } from "react-native-paper";
import RenderHTML from "react-native-render-html";
import { useCalendars } from "expo-localization";
import { useWindowDimensions } from "react-native";

export default function Titles() {
  const { width } = useWindowDimensions();
  const theme = useTheme();
  const locale = useAppSelector((state) => state.configuration.locale || "en");
  const cal = useCalendars();
  const onItemPressed = useLinkOpener();
  const { url } = useLocalSearchParams();
  const { data, isFetching, isLoading, refetch } = useGetFeedQuery(
    url as string
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
      keyExtractor={(item) => `item-card-${url}-${item.link}`}
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
              style={{
                borderTopLeftRadius: item.media ? 0 : void 0,
                borderTopRightRadius: item.media ? 0 : void 0,
                borderBottomLeftRadius: 0,
                borderBottomRightRadius: 0,
                backgroundColor: theme.colors.surfaceVariant,
              }}
              textStyle={{
                color: theme.colors.onSurfaceVariant,
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
              {item.description && item.description !== item.title && (
                <RenderHTML
                  contentWidth={width}
                  source={{ html: item.description }}
                  renderersProps={{
                    a: {
                      onPress(e, href) {
                        onItemPressed(href);
                      },
                    },
                  }}
                />
              )}
            </Card.Content>
            <Chip
              style={{
                borderTopLeftRadius: 0,
                borderTopRightRadius: 0,
                backgroundColor: theme.colors.surfaceVariant,
              }}
              textStyle={{
                color: theme.colors.onSurfaceVariant,
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
}
