# Altloom

Altloom is an accessibility-first GenLayer app that turns a public image into consensus-approved alt text and a longer description. GenLayer analyzes the image, validators enforce the output and safety rules, and the accepted description is stored on-chain.

## Deploy the Intelligent Contract

1. Open GenLayer Studio on Bradbury Testnet.
2. Create a new contract and paste `contracts/altloom.py`.
3. Deploy `Altloom` with no constructor arguments.
4. Wait until the deployment transaction is **FINALIZED**.
5. Put the contract address in `.env.local`:

```env
VITE_CONTRACT_ADDRESS=0xYOUR_CONTRACT_ADDRESS
```

6. Run `npm run build`, then deploy the app to Vercel.

## Test transaction

Connect MetaMask, keep the sample public image or paste another direct HTTPS image URL, add optional context, and select **Describe with consensus**. The app follows the transaction through proposal, commit, reveal, acceptance, and finalization before reading the canonical description from the contract.
