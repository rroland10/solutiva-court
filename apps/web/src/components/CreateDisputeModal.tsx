"use client";

import { useMemo, useState } from "react";
import { useChainWallet } from "@/context/Web3Provider";
import { Modal } from "./Modal";
import { useToast } from "./Toast";
import { Icon } from "./icons";
import { createDispute, getApiErrorMessage } from "@/lib/api";
import type { Page } from "@/lib/routing";
import { getChainConfig, isChainConfigured } from "@/lib/chain/config";
import { buildDisputeKey, depositAvfCollateral, filingFees } from "@/lib/chain/escrow";
import { useUser } from "@/context/UserContext";

interface CreateDisputeModalProps {
  userId?: string;
  onClose: () => void;
  onNavigate: (page: Page, subPath?: string) => void;
  onCreated?: () => void;
}

const PENDING_PREF_KEY = "solutiva-create-dispute-pending";

function loadStartPendingPref(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem(PENDING_PREF_KEY) === "true";
  } catch {
    return false;
  }
}

export function CreateDisputeModal({
  userId,
  onClose,
  onNavigate,
  onCreated,
}: CreateDisputeModalProps) {
  const [loading, setLoading] = useState(false);
  const [startPending, setStartPending] = useState(loadStartPendingPref);
  const [restitution, setRestitution] = useState(100);
  const { showToast } = useToast();
  const { walletMode } = useUser();
  const { address, isConnected, walletClient } = useChainWallet();
  const chainConfig = getChainConfig();
  const chainRequired = chainConfig.enabled && isChainConfigured();

  const fees = useMemo(() => filingFees(restitution), [restitution]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const form = new FormData(e.currentTarget);
    const startPendingValue = form.get("startPending") === "on";
    localStorage.setItem(PENDING_PREF_KEY, String(startPendingValue));

    const defendantAddress = form.get("defendantAddress") as string;
    const collateral = fees.total;

    if (chainRequired) {
      if (!isConnected || !address || !walletClient) {
        showToast("Connect your Base wallet to escrow AVF collateral.", "warning");
        setLoading(false);
        return;
      }
      if (!userId) {
        showToast("Wallet profile not loaded yet. Try again.", "warning");
        setLoading(false);
        return;
      }
    }

    try {
      let disputeKey: `0x${string}` | undefined;
      let escrowTxHash: string | undefined;

      if (chainRequired) {
        disputeKey = buildDisputeKey();
        showToast("Confirm AVF escrow on Base…", "success");
        escrowTxHash = await depositAvfCollateral(walletClient!, {
          account: address!,
          disputeKey,
          defendantAddress: defendantAddress as `0x${string}`,
          amountAvf: collateral,
        });
      }

      const dispute = await createDispute({
        title: form.get("title") as string,
        description: form.get("description") as string,
        category: form.get("category") as string,
        collateral,
        defendantAddress,
        ...(userId ? { plaintiffId: userId } : {}),
        ...(startPendingValue ? { status: "PENDING" as const } : {}),
        ...(disputeKey ? { disputeKey } : {}),
        ...(escrowTxHash ? { escrowTxHash } : {}),
      });

      showToast(
        startPendingValue
          ? "Dispute saved as pending. Activate it when ready."
          : chainRequired
            ? "Dispute filed on Base with AVF escrow. AI analysis queued."
            : "Dispute created successfully! AI analysis queued.",
        "success"
      );
      onCreated?.();
      onClose();
      onNavigate("disputes", dispute.id);
    } catch (err) {
      showToast(getApiErrorMessage(err, "Could not create dispute. Check API server."), "warning");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal title="Create New Dispute" onClose={onClose} size="large">
      <form onSubmit={handleSubmit} className="space-y-4">
        {chainRequired && (
          <div className="callout-info text-sm flex gap-2">
            <Icon name="shield" size="sm" className="text-blue-600 shrink-0 mt-0.5" />
            <span>
              Hybrid mode: case details stay off-chain; AVF collateral is escrowed on-chain
              ({chainConfig.network}) before filing.
            </span>
          </div>
        )}
        {walletMode === "demo" && chainConfig.enabled && (
          <div className="callout-warning text-sm">
            Connect a Base wallet to file disputes with on-chain escrow. Demo user is active.
          </div>
        )}
        <div>
          <label className="text-label block mb-1.5">Dispute Category</label>
          <select name="category" required className="input-luxury">
            <option value="">Select category...</option>
            <option value="CONTRACT">Contract Breach</option>
            <option value="PAYMENT">Payment Dispute</option>
            <option value="SERVICE">Service Quality</option>
            <option value="INTELLECTUAL">IP Violation</option>
            <option value="EMPLOYMENT">Employment Issue</option>
          </select>
        </div>
        <div>
          <label className="text-label block mb-1.5">Title</label>
          <input name="title" required className="input-luxury" placeholder="Case title" />
        </div>
        <div>
          <label className="text-label block mb-1.5">Defendant Address</label>
          <input
            name="defendantAddress"
            required
            className="input-luxury"
            placeholder="0x..."
          />
        </div>
        <div>
          <label className="text-label block mb-1.5">Requested Restitution (AVF)</label>
          <input
            name="restitution"
            type="number"
            min="0"
            step="0.01"
            required
            value={restitution}
            onChange={(e) => setRestitution(Number(e.target.value) || 0)}
            className="input-luxury"
            placeholder="0.00"
          />
        </div>
        <div>
          <label className="text-label block mb-1.5">Description</label>
          <textarea
            name="description"
            required
            rows={4}
            className="input-luxury"
            placeholder="Describe your dispute in detail..."
          />
        </div>
        <label className="checkbox-row">
          <input
            type="checkbox"
            name="startPending"
            checked={startPending}
            onChange={(e) => setStartPending(e.target.checked)}
            className="rounded text-primary"
          />
          <Icon name="clock" size="sm" className="text-primary" />
          Save as pending (activate later before jury voting)
        </label>
        {startPending && (
          <div className="callout-info text-sm flex gap-2">
            <Icon name="clock" size="sm" className="text-blue-600 shrink-0 mt-0.5" />
            <span>
              Pending cases stay off the jury docket until you activate them from your case list.
            </span>
          </div>
        )}
        <div className="meta-tile space-y-2">
          <h5 className="section-title text-base">
            <Icon name="coins" size="sm" className="text-gold" />
            Required Collateral ({chainConfig.network} Escrow)
          </h5>
          <dl className="metric-row">
            <dt>Filing Fee (2%)</dt>
            <dd>{fees.filingFee} AVF</dd>
          </dl>
          <dl className="metric-row">
            <dt>Security Deposit (20%)</dt>
            <dd>{fees.securityDeposit} AVF</dd>
          </dl>
          <hr className="border-gray-200 dark:border-gray-600" />
          <dl className="metric-row">
            <dt>Total Escrow</dt>
            <dd className="text-primary-dark dark:text-primary-light">{fees.total} AVF</dd>
          </dl>
        </div>
        <div className="flex gap-3 justify-end">
          <button type="button" className="btn-outline" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn-primary inline-flex items-center gap-2" disabled={loading}>
            <Icon name="plus" size="sm" className="text-white" />
            {loading ? "Creating..." : chainRequired ? "Escrow & File Dispute" : "Create Dispute"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
