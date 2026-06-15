# Solutiva Court — Hybrid Contracts

Solidity contracts for the hybrid on-chain layer: AVF collateral escrow (ERC-223) and outcome anchoring.

## Contracts

| Contract | Role |
| --- | --- |
| `DisputeEscrow` | Holds AVF collateral via ERC-223 `tokenReceived` hook |
| `OutcomeRegistry` | Anchors outcome hashes for resolved disputes |
| `AVF` | Local dev token only — production uses the official Sepolia AVF_Token |

Official AVF testnet token (Sepolia): `0x45D39B5C90685AF368EecbacB6EB7bbA6f9B1936`

Source: [EthereumCommonwealth/AVF_Token](https://github.com/EthereumCommonwealth/AVF_Token)

## Local deploy (Hardhat)

```bash
npm run contracts:compile
npm run contracts:deploy:local
```

Writes `deployments/31337.json` with local AVF, escrow, and registry addresses.

## Sepolia deploy

Requires a funded deployer wallet and Sepolia RPC access.

```bash
export DEPLOYER_PRIVATE_KEY=0x...
export CHAIN_RPC_URL=https://rpc.sepolia.org
export AVF_TOKEN_ADDRESS=0x45D39B5C90685AF368EecbacB6EB7bbA6f9B1936

npm run contracts:deploy:sepolia
```

Or from the repo root:

```bash
AVF_TOKEN_ADDRESS=0x45D39B5C90685AF368EecbacB6EB7bbA6f9B1936 \
DEPLOYER_PRIVATE_KEY=0x... \
npm run contracts:deploy:sepolia
```

After deploy, copy addresses from `deployments/11155111.json` into `.env`:

```env
CHAIN_ENABLED=true
DISPUTE_ESCROW_ADDRESS=0x...
OUTCOME_REGISTRY_ADDRESS=0x...
RELAYER_PRIVATE_KEY=0x...   # same or separate wallet for anchoring / optional mints
NEXT_PUBLIC_CHAIN_ENABLED=true
NEXT_PUBLIC_DISPUTE_ESCROW_ADDRESS=0x...
NEXT_PUBLIC_OUTCOME_REGISTRY_ADDRESS=0x...
```

Set `AVF_REWARDS_ON_CHAIN=true` only if the relayer wallet is the AVF_Token owner (mint is owner-only on Sepolia).

## Export ABIs

```bash
npm run contracts:export
```

Copies ABIs into `apps/api/src/abi/` for the API relayer client.
