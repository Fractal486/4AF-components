import { defineStory } from "@/lib/story";
import { ButtonStory } from "./button.demo";

export const story = defineStory({
  Component: ButtonStory,
  args: {
    initial: {
      variant: "primary",
      size: "md",
      label: "Deploy",
      icon: "none",
      loading: false,
      disabled: false,
      asChild: false,
    },
  },
});
