"use client";

import { formatWallet } from "@/lib/api";
import { networkLabel, txExplorerUrl } from "@/lib/chain/chains";
import { Icon } from "./icons";

interface OnChainRecordProps {
  chainId?: number | null;
  disputeKey?: string | null;
  escrowTxHash?: string | null;
  outcomeHash?: string | null;
  outcomeTxHash?: string | null;
}

function hasOnChainData(props: OnChainRecordProps): boolean {
  return Boolean(
    props.disputeKey || props.escrowTxHash || props.outcomeHash || props.outcomeTxHash
  );
}

export function OnChainRecord(props: OnChainRecordProps) {
  if (!hasOnChainData(props)) return null;

  const chainId = props.chainId ?? 11155111;
  const network = networkLabel(chainId);

  return (
    <div className="rounded-xl border border-primary/15 bg-primary/5 p-4 space-y-3 text-sm">
      <h4 className="section-title text-sm flex items-center gap-2">
        <Icon name="link" size="sm" className="text-primary" />
        On-chain record ({network})
      </h4>
      <dl className="grid gap-2 sm:grid-cols-2">
        {props.disputeKey ? (
          <div>
            <dt className="meta-label">Dispute key</dt>
            <dd className="font-mono text-xs text-gray-900 break-all">{props.disputeKey}</dd>
          </div>
        ) : null}
        {props.escrowTxHash ? (
          <div>
            <dt className="meta-label">Escrow deposit</dt>
            <dd>
              <a
                href={txExplorerUrl(chainId, props.escrowTxHash)}
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono text-xs text-primary underline underline-offset-2"
                title={props.escrowTxHash}
              >
                {formatWallet(props.escrowTxHash)}
              </a>
            </dd>
          </div>
        ) : null}
        {props.outcomeHash ? (
          <div>
            <dt className="meta-label">Outcome hash</dt>
            <dd className="font-mono text-xs text-gray-900 break-all" title={props.outcomeHash}>
              {formatWallet(props.outcomeHash)}
            </dd>
          </div>
        ) : null}
        {props.outcomeTxHash ? (
          <div>
            <dt className="meta-label">Outcome anchor</dt>
            <dd>
              <a
                href={txExplorerUrl(chainId, props.outcomeTxHash)}
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono text-xs text-primary underline underline-offset-2"
                title={props.outcomeTxHash}
              >
                {formatWallet(props.outcomeTxHash)}
              </a>
            </dd>
          </div>
        ) : null}
      </dl>
    </div>
  );
}
