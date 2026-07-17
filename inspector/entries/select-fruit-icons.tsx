import {
  Apple,
  Banana,
  Cherry,
  CircleDot,
  Citrus,
  Grape,
  Leaf,
  type LucideIcon,
} from "lucide-react";

const FRUIT_ICONS: Record<string, LucideIcon> = {
  apple: Apple,
  banana: Banana,
  blueberry: CircleDot,
  grape: Grape,
  mango: Citrus,
  orange: Citrus,
  strawberry: Cherry,
  watermelon: Leaf,
};

export function FruitIcon({ value }: { value: string }) {
  const Icon = FRUIT_ICONS[value] ?? Leaf;
  return <Icon aria-hidden className="size-4" />;
}
