# QueryFlow - Core Rules

**Last Updated:** 2025-12-06

## Tech Stack
- Frontend: Next.js 16 + React 19 + Tailwind 4 + Thirdweb 5
- Backend: Express 5 + TypeScript + OpenAI 4
- Contracts: Solidity 0.8.28 + Foundry + OpenZeppelin 5.2
- Network: Avalanche Fuji (Chain ID: 43113)

## Hard Rules

### File Naming
- Components: `PaymentForm.tsx` (PascalCase)
- Utils: `formatAddress.ts` (camelCase)
- Folders: `payment/` (lowercase)

### Code Style
- Always TypeScript, never JavaScript
- Always functional components, never class components
- Always Tailwind classes, never inline styles
- Always custom errors in Solidity, not require strings

### Quality Gates
- `pnpm build` must pass before commit
- `forge test` must pass for contract changes
- No `any` types in TypeScript
- Max 200 lines per file (split if longer)

### Colors & Theme
- Background: `#0f1419`
- Accent: `#ffd700`
- Always dark theme only

### Git Commits
- Format: `feat:`, `fix:`, `docs:`, `chore:`
- Example: `feat: add payment form component`

## Environment
Frontend
NEXT_PUBLIC_THIRDWEB_CLIENT_ID=...
NEXT_PUBLIC_CHAIN_ID=43113

Backend
OPENAI_API_KEY=...
FUJI_RPC_URL=https://api.avax-test.network/ext/bc/C/rpc

Contracts
PRIVATE_KEY=...
SNOWTRACE_API_KEY=...

text

## Commands
pnpm dev # Run all
pnpm build # Build all (must pass)
forge test # Test contracts

text
