import {
  LayoutAnimation,
  Platform,
  UIManager,
  type LayoutAnimationConfig,
} from "react-native";

const defaultConfig: LayoutAnimationConfig = {
  ...LayoutAnimation.Presets.easeInEaseOut,
};

if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export function animateLayout(config: LayoutAnimationConfig = defaultConfig) {
  LayoutAnimation.configureNext(config);
}

