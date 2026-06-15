"use client";

import { useCallback, useEffect, useState } from "react";
import { Header } from "@/components/Header";
import { ApiStatusBanner } from "@/components/ApiStatusBanner";
import { UserActivitySync } from "@/components/UserActivitySync";
import { Footer } from "@/components/Footer";
import { Dashboard } from "@/components/Dashboard";
import { Disputes } from "@/components/Disputes";
import { Jury } from "@/components/Jury";
import { Profile } from "@/components/Profile";
import { ShortcutsModal } from "@/components/ShortcutsModal";
import { AppLoading } from "@/components/AppLoading";
import { ToastProvider } from "@/components/Toast";
import { UserProvider, useUser } from "@/context/UserContext";
import { Web3Provider } from "@/context/Web3Provider";
import { UserStatsProvider } from "@/context/UserStatsContext";
import { PlatformProvider } from "@/context/PlatformContext";
import { ActiveVotingProvider, useActiveVoting } from "@/context/ActiveVotingContext";
import { PendingCasesProvider, usePendingCases } from "@/context/PendingCasesContext";
import { parseRoute, setRoute, navigateToFirstPendingCase, type Page } from "@/lib/routing";
import { dispatchAppShortcut } from "@/lib/shortcuts";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { useTheme } from "@/context/ThemeContext";

const PAGE_TITLES: Record<Page, string> = {
  dashboard: "Dashboard",
  disputes: "Disputes",
  jury: "Jury Pool",
  profile: "Profile",
};

export type { Page };

function AppContent({
  currentPage,
  disputeId,
  visits,
  navigate,
  onShowShortcuts,
}: {
  currentPage: Page;
  disputeId?: string;
  visits: Record<Page, number>;
  navigate: (page: Page, subPath?: string) => void;
  onShowShortcuts: () => void;
}) {
  const { loading } = useUser();
  const { needsVote } = useActiveVoting();
  const { pendingCases } = usePendingCases();
  const { toggleDark } = useTheme();

  useEffect(() => {
    const keyMap: Record<string, Page> = {
      "1": "dashboard",
      "2": "disputes",
      "3": "jury",
      "4": "profile",
    };

    function onKeyDown(e: KeyboardEvent) {
      const target = e.target;
      if (
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLSelectElement
      ) {
        return;
      }

      const page = keyMap[e.key];
      if (page) {
        e.preventDefault();
        navigate(page);
        return;
      }

      if (e.key === "?") {
        e.preventDefault();
        onShowShortcuts();
        return;
      }

      if (e.key === "t") {
        e.preventDefault();
        toggleDark();
        return;
      }

      if (e.key === "v" && needsVote) {
        e.preventDefault();
        navigate("jury");
        return;
      }

      if (e.key === "p" && pendingCases.length > 0) {
        e.preventDefault();
        navigateToFirstPendingCase(pendingCases, navigate);
        return;
      }

      if (e.key === "n" && (currentPage === "disputes" || currentPage === "dashboard")) {
        e.preventDefault();
        dispatchAppShortcut("create-dispute");
        return;
      }

      if (e.key === "/" && currentPage === "disputes") {
        e.preventDefault();
        dispatchAppShortcut("focus-search");
        return;
      }

      if (e.key === "m" && currentPage === "disputes") {
        e.preventDefault();
        dispatchAppShortcut("toggle-my-cases");
        return;
      }

      if (e.key === "f" && currentPage === "disputes") {
        e.preventDefault();
        dispatchAppShortcut("clear-filters");
        return;
      }

      if (e.key === "a" && currentPage === "disputes") {
        e.preventDefault();
        dispatchAppShortcut("filter-active");
        return;
      }

      if (e.key === "s" && currentPage === "disputes") {
        e.preventDefault();
        dispatchAppShortcut("filter-my-pending");
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [navigate, currentPage, needsVote, pendingCases, onShowShortcuts, toggleDark]);

  if (loading) {
    return <AppLoading />;
  }

  return (
    <>
      <Header currentPage={currentPage} onNavigate={navigate} />
      <main
        id="main-content"
        aria-label="Main content"
        className="flex-1 container mx-auto px-4 py-10 pb-28 md:pb-10 max-w-6xl"
      >
        {currentPage === "dashboard" && (
          <Dashboard key={visits.dashboard} onNavigate={navigate} />
        )}
        {currentPage === "disputes" && (
          <Disputes
            key={`${visits.disputes}-${disputeId ?? ""}`}
            onNavigate={navigate}
            initialDisputeId={disputeId}
          />
        )}
        {currentPage === "jury" && <Jury key={visits.jury} onNavigate={navigate} />}
        {currentPage === "profile" && <Profile key={visits.profile} onNavigate={navigate} />}
      </main>
      <Footer onShowShortcuts={onShowShortcuts} />
      <MobileBottomNav currentPage={currentPage} onNavigate={navigate} />
    </>
  );
}

export default function AppShell() {
  const [currentPage, setCurrentPage] = useState<Page>("dashboard");
  const [disputeId, setDisputeId] = useState<string | undefined>();
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [visits, setVisits] = useState<Record<Page, number>>({
    dashboard: 0,
    disputes: 0,
    jury: 0,
    profile: 0,
  });

  const bumpVisit = useCallback((page: Page) => {
    setVisits((v) => ({ ...v, [page]: v[page] + 1 }));
  }, []);

  const applyRoute = useCallback(() => {
    const { page, disputeId: id } = parseRoute();
    setCurrentPage(page);
    setDisputeId(id);
    document.title = `${PAGE_TITLES[page]} | Solutiva Court`;
  }, []);

  useEffect(() => {
    applyRoute();
  }, [applyRoute]);

  useEffect(() => {
    function onRouteChange() {
      applyRoute();
      const { page } = parseRoute();
      bumpVisit(page);
    }

    window.addEventListener("popstate", onRouteChange);
    return () => {
      window.removeEventListener("popstate", onRouteChange);
    };
  }, [applyRoute, bumpVisit]);

  const navigate = useCallback(
    (page: Page, subPath?: string) => {
      setRoute(page, subPath);
      const { page: resolvedPage, disputeId: id } = parseRoute();
      setCurrentPage(resolvedPage);
      setDisputeId(id);
      bumpVisit(resolvedPage);
      document.title = `${PAGE_TITLES[resolvedPage]} | Solutiva Court`;
    },
    [bumpVisit]
  );

  return (
    <ToastProvider>
      <Web3Provider>
        <UserProvider>
          <PlatformProvider>
            <UserStatsProvider>
              <PendingCasesProvider>
                <ActiveVotingProvider>
                  <div className="app-layer min-h-screen flex flex-col">
                    <ApiStatusBanner />
                    <UserActivitySync />
                    <AppContent
                      currentPage={currentPage}
                      disputeId={disputeId}
                      visits={visits}
                      navigate={navigate}
                      onShowShortcuts={() => setShowShortcuts(true)}
                    />
                    {showShortcuts && <ShortcutsModal onClose={() => setShowShortcuts(false)} />}
                  </div>
                </ActiveVotingProvider>
              </PendingCasesProvider>
            </UserStatsProvider>
          </PlatformProvider>
        </UserProvider>
      </Web3Provider>
    </ToastProvider>
  );
}
