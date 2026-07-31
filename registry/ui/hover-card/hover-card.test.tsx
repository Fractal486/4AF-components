import { render, screen } from "@testing-library/react";
import {
  HoverCard,
  HoverCardContent,
  HoverCardSkeleton,
  HoverCardTrigger,
} from "./hover-card";

describe("HoverCardSkeleton", () => {
  it("renders an avatar and copy placeholders by default", () => {
    const { container } = render(<HoverCardSkeleton />);

    expect(container.querySelector('[data-slot="hover-card-skeleton"]')).toHaveAttribute(
      "aria-hidden",
      "true",
    );
    expect(container.querySelectorAll('[data-slot="skeleton"]')).toHaveLength(6);
  });

  it("can omit the avatar placeholder", () => {
    const { container } = render(<HoverCardSkeleton showAvatar={false} />);

    expect(container.querySelectorAll('[data-slot="skeleton"]')).toHaveLength(5);
  });
});

describe("HoverCardContent loading", () => {
  it("replaces preview content and marks the popup busy", () => {
    render(
      <HoverCard open>
        <HoverCardTrigger>Profile</HoverCardTrigger>
        <HoverCardContent loading>
          <span>Loaded profile</span>
        </HoverCardContent>
      </HoverCard>,
    );

    const popup = document.querySelector('[data-loading="true"]');
    expect(popup).toHaveAttribute("aria-busy", "true");
    expect(popup?.querySelector('[data-slot="hover-card-skeleton"]')).toBeInTheDocument();
    expect(screen.queryByText("Loaded profile")).not.toBeInTheDocument();
  });
});
