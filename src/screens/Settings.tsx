import React from "react";
import { DevSettings, ScrollView, Alert } from "react-native";
import {
  ActivityIndicator,
  Divider,
  List,
  Menu,
  Paragraph,
} from "react-native-paper";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import {
  addFeed,
  saveAppearenceMode,
  saveLinksMode,
  saveLocale,
} from "../store/reducers/configuration";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { i18n } from "../translations";

const locales = {
  en: "English",
  fr: "Français",
  es: "Español",
};

export const Settings: React.FC = () => {
  const [isLoading, setLoading] = React.useState(false);
  const [localeMenuVisible, setLocaleMenuVisible] = React.useState(false);
  const dispatch = useAppDispatch();
  const appearenceMode = useAppSelector(
    (state) => state.configuration.appearenceMode
  );
  const locale = useAppSelector((state) => state.configuration.locale || "en");
  const openLinksMode = useAppSelector(
    (state) => state.configuration.openLinksMode
  );
  const feeds = useAppSelector((state) => state.configuration.feeds || {});

  const addFeedCallback = React.useCallback(() => {
    Alert.prompt(
      i18n.t("settings.popin.feedUrl"),
      i18n.t("settings.popin.feedUrlHelper"),
      (value) => {
        setLoading(true);
        dispatch(addFeed(value))
          .unwrap()
          .catch(() => {
            Alert.alert(i18n.t("settings.popin.feedUrlError"));
          })
          .finally(() => {
            setLoading(false);
          });
      }
    );
  }, [dispatch, setLoading]);

  return (
    <ScrollView style={{ flex: 1 }}>
      <List.Section title={i18n.t("settings.preferences")}>
        <List.Item
          title={i18n.t("settings.darkMode")}
          onPress={() => {
            const currIndex = ["dark", "light"].indexOf(appearenceMode || "");
            switch (currIndex) {
              case 0:
                dispatch(saveAppearenceMode("light"));
                break;
              case 1:
                dispatch(saveAppearenceMode());
                break;
              default:
                dispatch(saveAppearenceMode("dark"));
            }
          }}
          right={(props) => (
            <Paragraph
              {...props}
              style={{ flex: 1, alignSelf: "flex-end", textAlign: "right" }}
            >
              {appearenceMode === "dark"
                ? i18n.t("global.enabled")
                : appearenceMode === "light"
                ? i18n.t("global.disabled")
                : i18n.t("settings.darkMode-auto")}
            </Paragraph>
          )}
        />
        <List.Item
          title={i18n.t("settings.openLinksWithinApp")}
          onPress={() => {
            const currIndex = ["in", "out"].indexOf(openLinksMode || "in");
            switch (currIndex) {
              case 0:
                dispatch(saveLinksMode("out"));
                break;
              default:
                dispatch(saveLinksMode("in"));
            }
          }}
          right={(props) => (
            <Paragraph
              {...props}
              numberOfLines={1}
              style={{ flex: 1, alignSelf: "flex-end", textAlign: "right" }}
            >
              {openLinksMode === "in"
                ? i18n.t("global.enabled")
                : i18n.t("global.disabled")}
            </Paragraph>
          )}
        />
        <List.Item
          title={i18n.t("settings.locale")}
          onPress={() => {
            setLocaleMenuVisible(true);
          }}
          right={(props) => (
            <Menu
              visible={localeMenuVisible}
              onDismiss={() => setLocaleMenuVisible(false)}
              anchor={
                <Paragraph
                  numberOfLines={1}
                  style={{ flex: 1, alignSelf: "flex-end", textAlign: "right" }}
                >
                  {locales[locale]}
                </Paragraph>
              }
            >
              {Object.entries(locales).map(([key, name]) => (
                <Menu.Item
                  key={`locale-chooser-item-${key}`}
                  onPress={() => {
                    dispatch(saveLocale(key));
                    setLocaleMenuVisible(false);
                  }}
                  title={name}
                />
              ))}
            </Menu>
          )}
        />
        <List.Item
          title={i18n.t("settings.clearCache")}
          onPress={() => {
            AsyncStorage.clear();
            DevSettings.reload();
          }}
        />
      </List.Section>

      <List.Section title={i18n.t("settings.feeds")}>
        <List.Item
          title={i18n.t("settings.addFeed")}
          disabled={isLoading}
          right={(props) => <List.Icon {...props} icon="plus-circle" />}
          onPress={addFeedCallback}
        />
        {isLoading && (
          <List.Item
            title={(props) => <ActivityIndicator color={props.color} />}
          />
        )}
        {Object.entries(feeds).map(([url, { title, updated }]) => {
          if (!updated || !title || !url) {
            return <></>;
          }
          return (
            <List.Item
              key={`config-feed-${url}`}
              disabled={isLoading}
              title={title}
              description={url}
              right={(props) => <List.Icon {...props} icon="trash-can" />}
            />
          );
        })}
      </List.Section>
    </ScrollView>
  );
};
