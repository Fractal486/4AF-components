"use client";
import { useState } from "react";
import { BookOpen, UserPlus } from "lucide-react";
import { Badge, BadgeClose, BadgeCount, type BadgeProps } from "@/registry/ui/badge/badge";
import { Button } from "@/registry/ui/button/button";
import { CyclingBadge } from "./badge-cycling";

export function BadgePreview({ label, removable, count, animateCount, interactive, invalid, ...badgeProps }: BadgeProps & {
  label: string; removable: boolean; count: boolean; animateCount: boolean; interactive: 'none' | 'button' | 'link'; invalid: boolean;
}) {
  const [tags, setTags] = useState([0, 1, 2]);
  const [value, setValue] = useState(9);
  const displayLabel = removable ? label : interactive === 'button'
    ? 'Follow'
    : interactive === 'link' ? 'View docs' : label;
  const displayIcon = removable ? badgeProps.icon : interactive === 'button'
    ? <UserPlus />
    : interactive === 'link' ? <BookOpen /> : badgeProps.icon;
  const element = removable || interactive === 'none' ? undefined : interactive === 'link'
    ? <a href="#docs" /> : <button type="button" />;
  return <div className="flex w-[min(28rem,80vw)] max-w-full flex-col items-center gap-6">
    <div className="flex min-h-6 max-w-full flex-wrap items-center justify-center gap-2">
      {(removable ? tags : [0]).map(id => <Badge key={id} {...badgeProps} icon={displayIcon} render={element} aria-invalid={invalid || undefined}
        onOpenChangeComplete={open => { if (!open) setTags(current => current.filter(tag => tag !== id)); }}>
        {count ? <BadgeCount animated={animateCount} value={value} /> : id === 0 ? displayLabel : id === 1 ? 'Design' : 'Research'}
        {removable && <BadgeClose />}
      </Badge>)}
    </div>
    {count && <div className="flex gap-2"><Button size="sm" variant="ghost" onClick={() => setValue(v => Math.max(0, v - 1))}>−1</Button><Button size="sm" variant="ghost" onClick={() => setValue(v => v + 1)}>+1</Button><Button size="sm" variant="ghost" onClick={() => setValue(v => v + 10)}>+10</Button></div>}
    {removable && <Button size="sm" variant="ghost" onClick={() => setTags([0, 1, 2])}>Reset badges</Button>}
    {!removable && !count && <CyclingBadge variant={badgeProps.variant} size={badgeProps.size} shape={badgeProps.shape} showIcon={badgeProps.showIcon} dot={badgeProps.dot} pulse={badgeProps.pulse} neutralText={badgeProps.neutralText} />}
  </div>;
}
