"use client";

import { type ReactNode } from "react";
import { Icon, type IconName } from "./icons";

interface PageHeaderProps {
  title: string;
  description: string;
  icon?: IconName;
  action?: ReactNode;
}

export function PageHeader({ title, description, icon, action }: PageHeaderProps) {
  return (
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="text-on-gradient min-w-0 flex-1">
        <div className="flex items-center gap-3.5">
          {icon && (
            <span className="inline-flex shrink-0 items-center justify-center w-11 h-11 rounded-xl bg-white/12 backdrop-blur-md ring-1 ring-gold/35 shadow-[0_4px_16px_rgba(0,0,0,0.12)]">
              <Icon name={icon} size="md" className="text-white" />
            </span>
          )}
          <div className="min-w-0 pt-0.5">
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-white">{title}</h1>
            <div className="luxury-divider mt-2 max-w-[12rem]" />
          </div>
        </div>
        <p className="mt-3 text-sm sm:text-base leading-relaxed max-w-xl text-white/75 font-normal">
          {description}
        </p>
      </div>
      {action && <div className="shrink-0 self-start sm:mt-1">{action}</div>}
    </div>
  );
}
