"use client";

import { useEffect } from "react";
import { usePlatform } from "@/context/PlatformContext";
import { useUser } from "@/context/UserContext";

export function UserActivitySync() {
  const { activities } = usePlatform();
  const { refreshUser } = useUser();
  const activitySig = activities.map((activity) => activity.id).join(",");

  useEffect(() => {
    if (!activitySig) return;
    refreshUser();
  }, [activitySig, refreshUser]);

  return null;
}
