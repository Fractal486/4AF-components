import { defineStory } from "@/lib/story";
import { MorphStory } from "./morph.demo";

export const story = defineStory({
  Component: MorphStory,
  args: {
    initial: {
      variant: "outline",
    },
  },
});
