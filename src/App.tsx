import { FormEvent, useEffect, useRef, useState } from "react";
import type { Hash } from "genlayer-js/types";
import {
  ArrowDown,
  Check,
  CircleAlert,
  Clipboard,
  ExternalLink,
  Eye,
  Image as ImageIcon,
  LoaderCircle,
  ShieldCheck,
  Wallet,
} from "lucide-react";
import {
  CONTRACT_ADDRESS,
  EXPLORER_URL,
  createWriteClient,
  ensureBradburyNetwork,
  errorMessage,
  readClient,
  shortAddress,
} from "./genlayer";

type Phase = "idle" | "signing" | "pending" | "proposing" | "committing" | "revealing" | "accepted" | "finalized";
type Description = { imageUrl: string; kind: string; altText: string; longDescription: string };

const DEMO_IMAGE = "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3f/Fronalpstock_big.jpg/1280px-Fronalpstock_big.jpg";
const DEMO_RESULT: Description = {
  imageUrl: DEMO_IMAGE,
  kind: "PHOTO",
  altText: "A blue alpine lake surrounded by steep green mountains under a partly cloudy sky.",
  longDescription: "A wide landscape view looks across a deep blue lake enclosed by green mountain slopes. Rocky peaks rise in the distance beneath scattered white clouds, while a small settlement follows the shoreline.",
};

const phaseLabel: Record<Phase, string> = {
  idle: "Ready",
  signing: "Confirm in wallet",
  pending: "Pending",
  proposing: "Proposing",
  committing: "Committing",
  revealing: "Revealing",
  accepted: "Accepted",
  finalized: "Finalized",
};

function normalizePhase(value?: string): Phase {
  const phase = value?.toLowerCase();
  return phase && phase in phaseLabel ? phase as Phase : "pending";
}

function parseLatest(raw: unknown): Description | null {
  if (typeof raw !== "string" || !raw) return null;
  const [imageUrl, kind, altText, longDescription] = raw.split("|");
  return imageUrl && kind && altText && longDescription
    ? { imageUrl, kind, altText, longDescription }
    : null;
}

export default function App() {
  const [account, setAccount] = useState<`0x${string}` | null>(null);
  const [imageUrl, setImageUrl] = useState(DEMO_IMAGE);
  const [context, setContext] = useState("Alpine landscape used on a travel article");
  const [previewUrl, setPreviewUrl] = useState(DEMO_IMAGE);
  const [previewError, setPreviewError] = useState(false);
  const [phase, setPhase] = useState<Phase>("idle");
  const [txHash, setTxHash] = useState<`0x${string}` | null>(null);
  const [consensus, setConsensus] = useState("IDLE");
  const [result, setResult] = useState<Description | null>(CONTRACT_ADDRESS ? null : DEMO_RESULT);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const alive = useRef(true);
  const busy = !["idle", "accepted", "finalized"].includes(phase);

  useEffect(() => {
    alive.current = true;
    void window.ethereum?.request({ method: "eth_accounts" }).then((accounts) => {
      const first = Array.isArray(accounts) ? accounts[0] : null;
      if (typeof first === "string") setAccount(first as `0x${string}`);
    });
    if (CONTRACT_ADDRESS) {
      void readClient.readContract({ address: CONTRACT_ADDRESS, functionName: "get_latest", args: [] })
        .then((value) => setResult(parseLatest(value)))
        .catch(() => undefined);
    }
    return () => { alive.current = false; };
  }, []);

  const connectWallet = async () => {
    setError("");
    if (!window.ethereum) { setError("Install MetaMask to sign a GenLayer transaction."); return null; }
    try {
      const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
      const first = Array.isArray(accounts) ? accounts[0] : null;
      if (typeof first !== "string") throw new Error("No wallet account was returned.");
      await ensureBradburyNetwork();
      const address = first as `0x${string}`;
      setAccount(address);
      return { address, client: createWriteClient(address) };
    } catch (err) {
      setError(errorMessage(err));
      return null;
    }
  };

  const pollTransaction = async (hash: `0x${string}`) => {
    if (!CONTRACT_ADDRESS) return;
    for (let attempt = 0; attempt < 180 && alive.current; attempt += 1) {
      const tx = await readClient.getTransaction({ hash: hash as Hash });
      const next = normalizePhase(String(tx.statusName || "PENDING"));
      setPhase(next);
      setConsensus(String(tx.resultName || "IDLE"));
      if (next === "accepted" || next === "finalized") {
        const latest = await readClient.readContract({ address: CONTRACT_ADDRESS, functionName: "get_latest", args: [] });
        const parsed = parseLatest(latest);
        if (parsed) setResult(parsed);
        if (next === "finalized") return;
      }
      await new Promise((resolve) => window.setTimeout(resolve, 5000));
    }
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    try {
      const parsed = new URL(imageUrl);
      if (parsed.protocol !== "https:") throw new Error("Use a public HTTPS image URL.");
      setPreviewUrl(imageUrl);
      setPreviewError(false);
      if (!CONTRACT_ADDRESS) {
        setResult(DEMO_RESULT);
        throw new Error("Local preview is ready. Deploy the Altloom contract to unlock consensus.");
      }
      setPhase("signing");
      const wallet = account ? { address: account, client: createWriteClient(account) } : await connectWallet();
      if (!wallet) { setPhase("idle"); return; }
      await ensureBradburyNetwork();
      const hash = await wallet.client.writeContract({
        address: CONTRACT_ADDRESS,
        functionName: "describe_image",
        args: [imageUrl.trim(), context.trim()],
        value: 0n,
      });
      setTxHash(hash);
      await pollTransaction(hash);
    } catch (err) {
      setError(errorMessage(err));
      setPhase("idle");
    }
  };

  const copyAlt = async () => {
    if (!result) return;
    await navigator.clipboard.writeText(result.altText);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div className="site-shell">
      <a className="skip-link" href="#studio">Skip to image studio</a>
      <header className="topbar">
        <a className="brand" href="#top" aria-label="Altloom home"><span aria-hidden="true">A</span>ALTLOOM</a>
        <div className="header-actions">
          <div className="network"><i />BRADBURY TESTNET</div>
          <button className="wallet-button" type="button" onClick={() => void connectWallet()}>
            <Wallet size={18} aria-hidden="true" />{account ? shortAddress(account) : "Connect wallet"}
          </button>
        </div>
      </header>

      <main id="top">
        <section className="hero">
          <div className="hero-index" aria-hidden="true">01 / ACCESS</div>
          <p className="eyebrow"><Eye size={18} aria-hidden="true" />Accessibility, agreed by consensus</p>
          <h1>Make every image<br /><em>speak clearly.</em></h1>
          <p className="hero-copy">Altloom turns public images into neutral, useful descriptions reviewed by independent GenLayer validators.</p>
          <a className="jump-link" href="#studio">Describe an image <ArrowDown size={18} /></a>
        </section>

        <section className="studio" id="studio" aria-label="Altloom image description studio">
          <div className="visual-panel">
            <div className="section-label"><span>IMAGE INPUT</span><span>LIVE PREVIEW</span></div>
            <div className="image-frame">
              {previewError ? <div className="image-fallback"><ImageIcon size={36} /><p>Preview unavailable.<br />The public URL may still be checked by validators.</p></div> :
                <img src={previewUrl} alt={result?.imageUrl === previewUrl ? result.altText : ""} onError={() => setPreviewError(true)} />}
              <span className="corner corner-a" /><span className="corner corner-b" />
            </div>
            <div className="image-meta"><span>PUBLIC HTTPS</span><span>{result?.kind || "AWAITING ANALYSIS"}</span></div>
          </div>

          <div className="form-panel">
            <div className="section-label"><span>DESCRIPTION REQUEST</span><span>02 / CONSENSUS</span></div>
            <h2>Give the web<br />a better voice.</h2>
            <p>Paste a direct public image link. Context is optional and never overrides what validators can actually see.</p>
            <form onSubmit={(event) => void submit(event)} noValidate>
              <label htmlFor="image-url">Public image URL</label>
              <input id="image-url" type="url" required value={imageUrl} onChange={(event) => setImageUrl(event.target.value)} placeholder="https://example.com/image.jpg" />
              <label htmlFor="context">Publisher context <span>(optional)</span></label>
              <textarea id="context" maxLength={180} value={context} onChange={(event) => setContext(event.target.value)} placeholder="Where will this image appear?" />
              <div className="form-foot"><span>{context.length}/180</span><span><ShieldCheck size={16} />Consensus-checked output</span></div>
              {error ? <div className="error" role="alert"><CircleAlert size={18} />{error}</div> : null}
              <button className="submit-button" type="submit" disabled={busy}>
                {busy ? <LoaderCircle className="spin" size={20} /> : <Eye size={20} />}
                {busy ? phaseLabel[phase] : "Describe with consensus"}
              </button>
            </form>
          </div>
        </section>

        {result || txHash ? <section className="result" aria-live="polite">
          <div className="result-head">
            <p className="eyebrow"><Check size={17} />Consensus output</p>
            <span className={`status ${phase === "finalized" ? "done" : ""}`}>{txHash ? phaseLabel[phase] : "DEMO PREVIEW"}</span>
          </div>
          {result ? <div className="result-grid">
            <div><span className="result-label">ALT TEXT</span><p className="alt-text">{result.altText}</p><button className="copy" onClick={() => void copyAlt()} type="button"><Clipboard size={16} />{copied ? "Copied" : "Copy alt text"}</button></div>
            <div><span className="result-label">LONG DESCRIPTION</span><p>{result.longDescription}</p></div>
          </div> : <p>Validators are reviewing the image. Consensus: {consensus}</p>}
          {txHash ? <a className="tx-link" href={`${EXPLORER_URL}/tx/${txHash}`} target="_blank" rel="noreferrer">View transaction <ExternalLink size={16} /></a> : null}
        </section> : null}
      </main>

      <footer><span>ALTLOOM / 2026</span><span>Built on GenLayer</span><span>Images deserve language.</span></footer>
    </div>
  );
}
