import { defineStory } from "@/lib/story";
import { DialogStory } from "./dialog.demo";

export const story = defineStory({
  Component: DialogStory,
  args: {
    initial: {
      showClose: true,
      phases: false,
    },
  },
});
