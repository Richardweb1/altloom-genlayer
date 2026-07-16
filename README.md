# Altloom

Altloom is an accessibility-first GenLayer app that turns a public image into consensus-approved alt text and a longer description. A GenLayer Intelligent Contract renders the public image, asks validators to independently inspect it, compares their structured descriptions, and stores the accepted accessibility description on-chain.

## Live deployment

- App: https://altloom.vercel.app

## Network

- Network: GenLayer Bradbury Testnet (Chain ID `4221`)

- RPC: `https://rpc-bradbury.genlayer.com`

- Explorer: https://explorer-bradbury.genlayer.com

- Contract: [`0xaF4A9814B91f73aC8af465CB15402B15F51Eed45`](https://explorer-bradbury.genlayer.com/address/0xaF4A9814B91f73aC8af465CB15402B15F51Eed45)

- Deployment transaction: [`0x1e7d18dd5678b1065acdb4dc5dfdf0cde320d0ceb46b7d39caf562c060c8d22e`](https://explorer-bradbury.genlayer.com/tx/0x1e7d18dd5678b1065acdb4dc5dfdf0cde320d0ceb46b7d39caf562c060c8d22e) — `FINALIZED / AGREE`

- Verified app call: [`0x8d01fa66a118dd7dee1070bcbd0fd0689ce975aca2ae2211ec35849c6448d04e`](https://explorer-bradbury.genlayer.com/tx/0x8d01fa66a118dd7dee1070bcbd0fd0689ce975aca2ae2211ec35849c6448d04e) — `FINALIZED / AGREE`

## GenLayer validator pattern

Altloom uses GenLayer for the part that cannot be reduced to a normal backend job: deciding whether an image description is accurate, accessible, and safe enough to become the canonical record.

The contract no longer relies on leader-output-only validation. Validators execute their own image analysis function against the same public HTTPS image and compare the stable fields:

- image kind: `PHOTO`, `ILLUSTRATION`, `DIAGRAM`, or `OTHER`
- alt text length and safety rules
- long description length and safety rules
- content-word overlap between the leader and validator descriptions

This means the leader does not decide alone. Each validator independently inspects the image, produces its own structured result, and only agrees when the leader output is close enough under the contract's explicit comparison rules.

The contract source is in [`contracts/altloom.py`](contracts/altloom.py).

## Consensus output

Each accepted description stores:

- public HTTPS image URL
- image kind
- accessible alt text
- longer visual description
- submitter address
- description count

## Local checks

```bash
npm install
npm run schema
npm run typecheck
npm run build
genvm-lint contracts/altloom.py
```




## Test transaction

Connect MetaMask, keep the sample public image or paste another direct HTTPS image URL, add optional context, and select **Describe with consensus**. The app follows the transaction through proposal, commit, reveal, acceptance, and finalization before reading the canonical description from the contract.
