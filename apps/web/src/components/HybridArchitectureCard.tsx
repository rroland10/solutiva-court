"use client";

import { useEffect, useState } from "react";
import { Icon } from "./icons";
import { apiFetch } from "@/lib/api";
import { HYBRID_OFF_CHAIN, HYBRID_ON_CHAIN } from "@/lib/chain/config";
import { AVF_TOKEN_SOURCE } from "@/lib/chain/chains";

interface ChainConfigResponse {
  enabled: boolean;
  network: string;
  ready: boolean;
  escrowReady?: boolean;
    avfToken?: {
    address: string;
    explorer: string;
    source?: string;
    name: string;
    standard: string;
  };
}

export function HybridArchitectureCard() {
  const [config, setConfig] = useState<ChainConfigResponse | null>(null);

  useEffect(() => {
    apiFetch<ChainConfigResponse>("/api/chain/config")
      .then(setConfig)
      .catch(() => setConfig(null));
  }, []);

  return (
    <div className="card">
      <div className="card-header">
        <div className="flex items-center gap-2.5">
          <Icon name="shield" size="sm" className="text-primary" />
          <h3>Hybrid Architecture ({config?.network ?? "Sepolia"})</h3>
        </div>
      </div>
      <div className="card-body space-y-4 text-sm">
        <p className="text-muted font-medium">
          {config?.enabled
            ? `${config.network} · AVF ${config.avfToken?.address?.slice(0, 6)}… · ${config.ready ? "contracts ready" : config.escrowReady ? "escrow ready" : "AVF token only"}`
            : "Chain integration disabled — demo mode uses off-chain AVF balances."}
        </p>
        {config?.avfToken?.explorer && (
          <p className="text-sm flex flex-col gap-1">
            <a
              href={config.avfToken.explorer}
              target="_blank"
              rel="noopener noreferrer"
              className="link-accent"
            >
              View AVF_Token on Etherscan
            </a>
            <a
              href={config.avfToken.source ?? AVF_TOKEN_SOURCE}
              target="_blank"
              rel="noopener noreferrer"
              className="link-accent"
            >
              Official source (EthereumCommonwealth/AVF_Token)
            </a>
          </p>
        )}
        <div>
          <p className="section-title text-sm mb-2">On-chain</p>
          <ul className="space-y-1 text-muted">
            {HYBRID_ON_CHAIN.map((item) => (
              <li key={item} className="flex items-start gap-2">
                <Icon name="success" size="sm" className="text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                {item}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="section-title text-sm mb-2">Off-chain</p>
          <ul className="space-y-1 text-muted">
            {HYBRID_OFF_CHAIN.map((item) => (
              <li key={item} className="flex items-start gap-2">
                <Icon name="document" size="sm" className="text-primary shrink-0 mt-0.5" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
