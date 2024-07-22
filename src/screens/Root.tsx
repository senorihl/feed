import * as React from "react";
import Icons from "@expo/vector-icons/MaterialCommunityIcons";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Settings } from "./Settings";
import { Feeds } from "./Feeds";
import { RootTabParamList } from "../store/hooks";
import { i18n } from "../translations";
import { LocalizedHeaderTitle, LocalizedTitle } from "./Titles";
import { HeaderTitle } from "@react-navigation/elements";
import Logo from "../components/vectors/Logo";

const Tab = createBottomTabNavigator<RootTabParamList>();

export const Root: React.FC = () => {
  return (
    <Tab.Navigator>
      <Tab.Screen
        name="Feeds"
        component={Feeds}
        options={{
          headerShown: false,
          headerTitle: (props) => (
            <LocalizedHeaderTitle {...props} translationKey="screens.feeds" />
          ),
          tabBarLabel: (props) => (
            <LocalizedTitle
              translationKey="screens.feeds"
              {...props}
              style={{ fontSize: 10 }}
            />
          ),
          tabBarIcon: ({ color, size }) => (
            <Logo
              width={size}
              height={size}
              backgroundFill={"none"}
              fill={color}
            />
          ),
        }}
      />
      <Tab.Screen
        name="Settings"
        component={Settings}
        options={{
          headerTitle: (props) => (
            <LocalizedHeaderTitle translationKey="screens.settings" />
          ),
          tabBarLabel: (props) => (
            <LocalizedTitle
              translationKey={"screens.settings"}
              {...props}
              style={{ fontSize: 10 }}
            />
          ),
          tabBarIcon: ({ color, size }) => (
            <Icons name="cog" color={color} size={size} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};
