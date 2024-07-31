import React from "react";
import { DevSettings, ScrollView, TouchableOpacity } from "react-native";
import {
  Portal,
  Dialog,
  List,
  Menu,
  Paragraph,
  Button,
  TextInput,
  HelperText,
  useTheme,
  Text,
  ActivityIndicator,
} from "react-native-paper";
import {
  addFeed,
  addOPML,
  removeFeed,
  saveAppearenceMode,
  saveLinksMode,
  saveLocale,
} from "../src/store/reducers/configuration";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { i18n } from "../src/translations";
import { deleteDatabaseAsync } from "expo-sqlite";
import * as TaskManager from "expo-task-manager";
import { DATABASE_NAME, getDatabase } from "../src/services/database";
import {
  registerBackgroundFetchAsync,
  useStatus,
} from "../src/services/background";
import { BackgroundFetchStatus } from "expo-background-fetch";
import { useAppDispatch, useAppSelector } from "../src/store/hooks";

const locales = {
  en: "English",
  fr: "Français",
  es: "Español",
};

const Settings: React.FC = () => {
  const theme = useTheme();
  const { status, isRegistered, checkStatusAsync } = useStatus();
  const [toRemoveFeed, setToRemoveFeed] = React.useState<string | null>(null);
  const [addFeedVisible, setAddFeedVisible] = React.useState(false);
  const [isWorking, setWorking] = React.useState(false);
  const [feedURL, setFeedURL] = React.useState<string>();
  const [feedURLError, setFeedURLError] = React.useState(false);
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
    setFeedURL("");
    setAddFeedVisible(true);
    setFeedURLError(false);
  }, [dispatch]);

  return (
    <ScrollView style={{ flex: 1 }}>
      <Portal>
        <Dialog
          visible={!!toRemoveFeed}
          onDismiss={() => {
            setToRemoveFeed(null);
          }}
        >
          <Dialog.Content>
            <Text variant="bodyLarge">
              {i18n.t("settings.removeFeedConfirmation")}
            </Text>
            <Paragraph>{toRemoveFeed}</Paragraph>
          </Dialog.Content>
          <Dialog.Actions>
            <Button
              textColor={theme.colors.error}
              onPress={() => setToRemoveFeed(null)}
            >
              {i18n.t("global.cancel")}
            </Button>
            <Button
              onPress={() => {
                dispatch(removeFeed(toRemoveFeed));
                setToRemoveFeed(null);
              }}
            >
              {i18n.t("settings.removeFeedButton")}
            </Button>
          </Dialog.Actions>
        </Dialog>
        <Dialog
          visible={addFeedVisible}
          onDismiss={() => {
            setAddFeedVisible(false);
          }}
        >
          <Dialog.Content>
            <Text variant="bodyLarge" style={{ marginBottom: 20 }}>
              {i18n.t("settings.addFeed")}
            </Text>
            <TextInput
              disabled={isWorking}
              value={feedURL}
              keyboardType="url"
              label={i18n.t("settings.popin.feedUrl")}
              error={feedURLError}
              placeholder={i18n.t("settings.popin.feedUrl")}
              onChangeText={(val) => setFeedURL(val)}
              right={isWorking ? <ActivityIndicator size={"small"} /> : void 0}
            />
            <HelperText type={feedURLError ? "error" : "info"} visible>
              {feedURLError
                ? i18n.t("settings.popin.feedUrlError")
                : i18n.t("settings.popin.feedUrlHelper")}
            </HelperText>
          </Dialog.Content>
          <Dialog.Actions>
            <Button
              disabled={isWorking}
              textColor={theme.colors.error}
              onPress={() => {
                setAddFeedVisible(false);
                setFeedURL("");
                setFeedURLError(false);
              }}
            >
              {i18n.t("global.cancel")}
            </Button>
            <Button
              disabled={isWorking}
              onPress={() => {
                setWorking(true);
                dispatch(addFeed(feedURL))
                  .unwrap()
                  .then(() => {
                    setAddFeedVisible(false);
                    setFeedURLError(false);
                  })
                  .catch(() => dispatch(addOPML(feedURL)).unwrap())
                  .then(() => {
                    setAddFeedVisible(false);
                    setFeedURLError(false);
                  })
                  .catch((e) => {
                    console.debug(e);
                    setFeedURLError(true);
                  })
                  .finally(() => {
                    setWorking(false);
                  });
              }}
            >
              {i18n.t("global.add")}
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
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
                  style={{
                    flex: 1,
                    alignSelf: "flex-end",
                    textAlign: "right",
                  }}
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
          title={"Synchronisation en arrière-plan"}
          disabled={status === BackgroundFetchStatus.Denied}
          onPress={() => {
            (isRegistered
              ? TaskManager.unregisterAllTasksAsync()
              : registerBackgroundFetchAsync()
            ).finally(() => {
              checkStatusAsync();
            });
          }}
          right={(props) => (
            <Paragraph
              {...props}
              numberOfLines={1}
              style={{ flex: 1, alignSelf: "flex-end", textAlign: "right" }}
            >
              {status === BackgroundFetchStatus.Denied
                ? "Impossible"
                : isRegistered
                ? i18n.t("global.enabled")
                : i18n.t("global.disabled")}
            </Paragraph>
          )}
        />
        <List.Item
          title={i18n.t("settings.clearCache")}
          onPress={async () => {
            await AsyncStorage.clear();
            DevSettings.reload();
          }}
        />
        <List.Item
          title={i18n.t("settings.cleanDatabase")}
          onPress={async () => {
            await (await getDatabase()).closeAsync();
            await deleteDatabaseAsync(DATABASE_NAME);
            DevSettings.reload();
          }}
        />
      </List.Section>

      <List.Section title={i18n.t("settings.feeds")}>
        <List.Item
          title={i18n.t("settings.addFeed")}
          right={(props) => <List.Icon {...props} icon="plus-circle" />}
          onPress={addFeedCallback}
        />
        {Object.entries(feeds)
          .filter(([url, { title, updated }]) => !(!updated || !title || !url))
          .map(([url, { title, updated }]) => {
            return (
              <List.Item
                key={`config-feed-${url}`}
                title={title}
                description={url}
                right={(props) => (
                  <TouchableOpacity onPress={() => setToRemoveFeed(url)}>
                    <List.Icon {...props} icon="trash-can" />
                  </TouchableOpacity>
                )}
              />
            );
          })}
      </List.Section>
    </ScrollView>
  );
};

export default Settings;
