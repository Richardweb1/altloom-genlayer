# Altloom

Altloom is an accessibility-first GenLayer app that turns a public image into consensus-approved alt text and a longer description. GenLayer analyzes the image, validators enforce the output and safety rules, and the accepted description is stored on-chain.

## Live deployment

- App: https://projet-8-altloom.vercel.app


## Network

- Network: GenLayer Bradbury Testnet (Chain ID `4221`)

- RPC: `https://rpc-bradbury.genlayer.com`

- Explorer: https://explorer-bradbury.genlayer.com

- Contract: [`0xaF4A9814B91f73aC8af465CB15402B15F51Eed45`](https://explorer-bradbury.genlayer.com/address/0xaF4A9814B91f73aC8af465CB15402B15F51Eed45)

- Deployment transaction: [`0x1e7d18dd5678b1065acdb4dc5dfdf0cde320d0ceb46b7d39caf562c060c8d22e`](https://explorer-bradbury.genlayer.com/tx/0x1e7d18dd5678b1065acdb4dc5dfdf0cde320d0ceb46b7d39caf562c060c8d22e) — `FINALIZED / AGREE`

- Verified app call: [`0x8d01fa66a118dd7dee1070bcbd0fd0689ce975aca2ae2211ec35849c6448d04e`](https://explorer-bradbury.genlayer.com/tx/0x8d01fa66a118dd7dee1070bcbd0fd0689ce975aca2ae2211ec35849c6448d04e) — `FINALIZED / AGREE`




## Test transaction

Connect MetaMask, keep the sample public image or paste another direct HTTPS image URL, add optional context, and select **Describe with consensus**. The app follows the transaction through proposal, commit, reveal, acceptance, and finalization before reading the canonical description from the contract.
