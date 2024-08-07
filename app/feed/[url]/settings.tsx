import { useAppSelector, useAppDispatch } from "../../../src/store/hooks";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import {
  Button,
  Card,
  Chip,
  Dialog,
  List,
  Paragraph,
  Portal,
  Text,
  TextInput,
  Title,
  useTheme,
} from "react-native-paper";
import { useCalendars } from "expo-localization";
import {
  removeFeed,
  renameFeed,
} from "../../../src/store/reducers/configuration";
import { ScrollView, TextInput as NativeTextInput } from "react-native";
import React from "react";
import { i18n } from "../../../src/translations";

enum CONFIRMATION_STATE {
  NOT_YET,
  WAITING,
  OK,
}

export default function FeedConfiguration() {
  const dispatch = useAppDispatch();
  const theme = useTheme();
  const { url, name: title } = useLocalSearchParams();
  const [hasConfirmed, setConfirmed] = React.useState(false);
  const [nameDialogVisible, setNameDialogVisible] = React.useState(false);

  const feed = useAppSelector(
    (state) => state.configuration.feeds?.[url as string]
  );

  const [customName, setCustomName] = React.useState(feed.customName || "");

  useFocusEffect(
    React.useCallback(() => {
      setConfirmed(false);
    }, [])
  );
  const onPress = React.useCallback(() => {
    if (!hasConfirmed) {
      setConfirmed(true);
    } else {
      dispatch(removeFeed(url as string));
      router.back();
    }
  }, [hasConfirmed, url]);

  const onNameSubmit = React.useCallback(() => {
    setNameDialogVisible(false);
    dispatch(
      renameFeed({
        url: url as string,
        name: customName.trim().length === 0 ? void 0 : customName,
      })
    );
  }, [customName]);

  return (
    <ScrollView>
      <Portal>
        <Dialog
          visible={nameDialogVisible}
          dismissable
          onDismiss={() => setNameDialogVisible(false)}
        >
          <Dialog.Content>
            <Text variant="bodyLarge">Modifier le nom du flux</Text>
            <Paragraph>{url as string}</Paragraph>
            <TextInput
              keyboardType="url"
              label={"Nouveau nom"}
              placeholder={title as string}
              onChangeText={(val) => setCustomName(val)}
              defaultValue={customName}
              onSubmitEditing={onNameSubmit}
              autoFocus
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button
              textColor={theme.colors.error}
              onPress={() => setNameDialogVisible(false)}
            >
              {i18n.t("global.cancel")}
            </Button>
            <Button onPress={onNameSubmit}>Valider</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
      <List.Item
        title={"Nom"}
        descriptionNumberOfLines={typeof feed?.customName === "string" ? 2 : 1}
        description={
          (typeof feed?.customName === "string"
            ? `Nom personalisé: ${feed.customName}\n`
            : "") + feed?.title
        }
        onPress={() => setNameDialogVisible(true)}
      />
      <List.Item title={"Lien"} description={url} />
      <Button
        mode={!hasConfirmed ? "text" : "contained"}
        buttonColor={!hasConfirmed ? undefined : theme.colors.error}
        textColor={!hasConfirmed ? theme.colors.error : theme.colors.onError}
        style={{
          marginTop: 20,
          alignSelf: "center",
        }}
        onPress={onPress}
      >
        {hasConfirmed ? "Confirmer la suppression" : "Supprimer ce flux"}
      </Button>
    </ScrollView>
  );
}
