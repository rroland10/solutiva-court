import Script from "next/script";
import { THEME_STORAGE_KEY } from "@/lib/theme-preference";

const themeInitScript = `
(function () {
  try {
    var stored = localStorage.getItem("${THEME_STORAGE_KEY}");
    var dark =
      stored === "dark" ||
      (stored !== "light" &&
        window.matchMedia("(prefers-color-scheme: dark)").matches);
    document.documentElement.classList.toggle("dark", dark);
  } catch (e) {}
})();
`;

export function ThemeInit() {
  return (
    <Script id="theme-init" strategy="beforeInteractive">
      {themeInitScript}
    </Script>
  );
}
