import * as React from "react";
import Svg, {
  G,
  Rect,
  Path,
  type SvgProps,
  type RectProps,
  type PathProps,
} from "react-native-svg";

export type LogoProps = Partial<
  Pick<SvgProps, "width" | "height"> & {
    backgroundFill: RectProps["fill"];
    fill: PathProps["fill"];
  }
>;

const Logo: React.FC<LogoProps> = ({
  width = 1024,
  height = 1024,
  fill = "#2B3A67",
  backgroundFill = "#F8F9FA",
}) => (
  <Svg viewBox="0 0 1024 1024" {...{ width, height }}>
    <G>
      <Rect width={1024} height={1024} fill={backgroundFill} />
      <Path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M601.269 62.09a37.4 37.4 0 0 1 10.483.749 8764 8764 0 0 1 229.095 136.258l12.727 9.733q1.497 2.246 0 4.492a356 356 0 0 1-32.194 20.215 38626 38626 0 0 0-396.799 225.351 44443 44443 0 0 0-2.246 363.858A20185 20185 0 0 1 173.026 962a821 821 0 0 1-2.246-49.414 40527 40527 0 0 1 .748-603.433A88766 88766 0 0 0 601.269 62.091"
        fill={fill}
      />
      <Path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M606.775 411.968q9.908-.667 17.969 5.241A13810 13810 0 0 1 858.33 559.458q5.991 8.234 0 16.47a60589 60589 0 0 1-244.816 137.008 3519 3519 0 0 1-143.747-86.847 3039 3039 0 0 1 0-134.762 19716 19716 0 0 1 137.008-79.359"
        fill={fill}
      />
    </G>
  </Svg>
);
export default Logo;
