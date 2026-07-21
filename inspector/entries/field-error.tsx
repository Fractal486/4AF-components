import { FieldError } from "@/registry/ui/field-error/field-error";
import { defineEntry, text } from "../schema";

export const fieldErrorEntry = defineEntry({
  slug: "field-error",
  name: "Field Error",
  controls: {
    message: text("Please enter a valid email address.", "Message"),
  },
  render({ message }) {
    return <FieldError>{message}</FieldError>;
  },
});
