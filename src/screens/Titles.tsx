import { connect } from "react-redux";
import { AppState } from "../store";
import { Text } from "react-native-paper";
import { i18n } from "../translations";
import { Platform, StyleSheet, TextStyle } from "react-native";
import { HeaderTitle } from "@react-navigation/elements";

type BaseProps = {
  locale: AppState["configuration"]["locale"];
  translationKey: string;
  style?: TextStyle;
  color?: string;
  allowFontScaling?: boolean;
};

const Title: React.FC<BaseProps> = ({ locale, ...props }) => {
  return (
    <Text
      numberOfLines={1}
      allowFontScaling={props.allowFontScaling}
      style={[styles.title, props.style, { color: props.color }]}
    >
      {i18n.t(props.translationKey)}
    </Text>
  );
};

const CustomHeaderTitle: React.FC<{
  translationKey: string;
  locale: AppState["configuration"]["locale"];
}> = ({ locale, translationKey, ...props }) => {
  return <HeaderTitle {...props}>{i18n.t(translationKey)}</HeaderTitle>;
};

export const LocalizedTitle = connect((state: AppState) => ({
  locale: state.configuration.locale,
}))(Title);

export const LocalizedHeaderTitle = connect((state: AppState) => ({
  locale: state.configuration.locale,
}))(CustomHeaderTitle);

const styles = StyleSheet.create({
  title: Platform.select({
    ios: {
      fontSize: 17,
      fontWeight: "600",
    },
    android: {
      fontSize: 20,
      fontFamily: "sans-serif-medium",
      fontWeight: "normal",
    },
    default: {
      fontSize: 18,
      fontWeight: "500",
    },
  }),
});
