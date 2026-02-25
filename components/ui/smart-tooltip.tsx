"use client";

import { useState } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface SmartTooltipProps {
  children: React.ReactElement;
  content: React.ReactNode;
  side?: "left" | "right" | "top" | "bottom";
  align?: "start" | "center" | "end";
  isMobile: boolean;
}

/**
 * Tooltip adaptativo: usa hover no desktop e tap/click no mobile (pointer: coarse).
 * No desktop renderiza o shadcn Tooltip; no mobile usa Popover para funcionar com touch.
 */
export function SmartTooltip({
  children,
  content,
  side = "right",
  align = "start",
  isMobile,
}: SmartTooltipProps) {
  const [open, setOpen] = useState(false);

  if (!isMobile) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{children}</TooltipTrigger>
        <TooltipContent
          side={side}
          align={align}
          sideOffset={8}
          className="p-0 border-none bg-transparent shadow-none w-auto min-w-0"
        >
          {content}
        </TooltipContent>
      </Tooltip>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent
        side="bottom"
        align="center"
        sideOffset={6}
        className="p-0 border-none bg-transparent shadow-none w-auto min-w-0 max-w-[95vw] overflow-auto"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        {content}
      </PopoverContent>
    </Popover>
  );
}
