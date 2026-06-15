export function Footer({ onShowShortcuts }: { onShowShortcuts?: () => void }) {
  return (
    <footer className="border-t border-white/20 mt-auto bg-black/10 backdrop-blur-sm">
      <div className="container mx-auto max-w-6xl px-4 py-8 text-center text-white text-sm font-semibold">
        <div className="footer-divider" />
        <p className="font-display text-lg tracking-wide">Solutiva Court v5.0</p>
        <p className="text-sm mt-2 text-white/95 font-semibold max-w-2xl mx-auto leading-relaxed">
          Hybrid dispute resolution on Base L2 · AVF ERC-223 escrow & outcomes on-chain · jury voting, AI, and search off-chain
          {onShowShortcuts && (
            <>
              {" · "}
              <button
                type="button"
                onClick={onShowShortcuts}
                className="underline underline-offset-2 hover:text-white transition-colors"
              >
                Keyboard shortcuts (?)
              </button>
            </>
          )}
        </p>
      </div>
    </footer>
  );
}
