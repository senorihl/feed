import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { List } from "./List";
import { Feed } from "./Feed";
import {
  FeedStackParamList,
  useAppDispatch,
  useAppSelector,
} from "../../store/hooks";
import { IconButton } from "react-native-paper";
import { saveAppearenceMode } from "../../store/reducers/configuration";
import React from "react";
import { LocalizedHeaderTitle } from "../Titles";

const Stack = createNativeStackNavigator<FeedStackParamList>();

export const Feeds: React.FC = () => {
  const dispatch = useAppDispatch();
  const appearenceMode = useAppSelector(
    (state) => state.configuration.appearenceMode
  );
  return (
    <Stack.Navigator
      screenOptions={{
        headerRight: __DEV__
          ? (props) => {
              return (
                <IconButton
                  icon={"theme-light-dark"}
                  onPress={() => {
                    const currIndex = ["dark", "light"].indexOf(
                      appearenceMode || ""
                    );
                    switch (currIndex) {
                      case 0:
                        dispatch(saveAppearenceMode("light"));
                        break;
                      default:
                        dispatch(saveAppearenceMode("dark"));
                    }
                  }}
                />
              );
            }
          : void 0,
      }}
    >
      <Stack.Screen
        name="List"
        component={List}
        options={{
          headerTitle: (props) => (
            <LocalizedHeaderTitle translationKey="screens.feeds" />
          ),
          headerBackTitleVisible: false,
        }}
      />
      <Stack.Screen
        name="Feed"
        component={Feed}
        options={({ route }) => ({
          title: route.params.title,
          headerBackTitleVisible: false,
        })}
      />
    </Stack.Navigator>
  );
};
