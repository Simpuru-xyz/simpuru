// The sign-in page an MCP client opens: connect a Cardano wallet (CIP-30), set limits, sign once.
const esc = (s: string) =>
  s.replace(
    /[&<>"']/g,
    (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[ch] ?? ch,
  );

export const consentHtml = (o: {
  request: string;
  clientName: string;
  demo: boolean;
}) => `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Connect your agent · Simpuru</title>
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Inter+Tight:wght@400;500;600&display=swap" rel="stylesheet" />
<style>
  :root { --bg:#f4f4f2; --card:#fff; --ink:#0b0b0c; --muted:#6b6b70; --line:rgba(11,11,12,.1); --ok:#0f7b3f; --err:#b42318; }
  * { box-sizing: border-box; }
  body { margin:0; min-height:100svh; display:grid; place-items:center; background:var(--bg); color:var(--ink);
         font-family:'Inter Tight',system-ui,sans-serif; padding:24px; }
  main { width:100%; max-width:440px; background:var(--card); border-radius:20px; padding:32px;
         box-shadow:0 1px 2px rgba(0,0,0,.04), 0 12px 40px rgba(0,0,0,.06); }
  .brand { font-weight:600; font-size:15px; letter-spacing:-.01em; margin-bottom:28px; }
  h1 { font-size:26px; line-height:1.15; letter-spacing:-.03em; font-weight:600; margin:0 0 10px; }
  p { color:var(--muted); line-height:1.5; margin:0 0 20px; font-size:15px; }
  .client { color:var(--ink); font-weight:500; }
  fieldset { border:0; padding:0; margin:0 0 22px; display:grid; grid-template-columns:1fr 1fr; gap:12px; }
  label { font-size:13px; color:var(--muted); display:grid; gap:6px; }
  input { font:inherit; font-size:16px; padding:10px 12px; border-radius:10px; border:1px solid var(--line); background:#fafafa; }
  .wallets { display:grid; gap:8px; }
  button { font:inherit; font-size:15px; font-weight:500; cursor:pointer; border:0; border-radius:12px; padding:13px 16px;
           display:flex; align-items:center; gap:10px; justify-content:center; transition:background .2s, transform .1s; }
  button:active { transform:scale(.98); }
  .wallet { background:var(--ink); color:#fff; }
  .wallet img { width:20px; height:20px; border-radius:5px; }
  .wallet:hover { background:#26262a; }
  .ghost { background:transparent; color:var(--ink); border:1px solid var(--line); margin-top:8px; width:100%; }
  .ghost:hover { background:#f2f2f0; }
  .note { font-size:13px; margin-top:18px; }
  .msg { font-size:14px; margin-top:16px; min-height:20px; }
  .msg.err { color:var(--err); } .msg.ok { color:var(--ok); }
  .done { display:none; }
  .addr { font-family:ui-monospace,Menlo,monospace; font-size:12.5px; word-break:break-all; background:#f6f6f4;
          border-radius:10px; padding:12px; margin:8px 0 16px; }
  :focus-visible { outline:2px solid var(--ink); outline-offset:3px; }
</style>
</head>
<body>
<main>
  <div class="brand">◆ Simpuru</div>
  <section id="ask">
    <h1>Let your agent shop for you</h1>
    <p><span class="client">${esc(o.clientName)}</span> wants to buy on Simpuru on your behalf.
      Sign in with your Cardano wallet: Simpuru gives your agent its own wallet, which only spends inside
      the limits below. You fund it, and you can take what's left back at any time.</p>
    <fieldset>
      <label>Max per purchase (ADA)<input id="per" type="number" min="1" max="100" value="10" /></label>
      <label>Daily budget (ADA)<input id="day" type="number" min="1" max="500" value="30" /></label>
    </fieldset>
    <div class="wallets" id="wallets"></div>
    ${o.demo ? '<button class="ghost" id="demo" type="button">No preprod wallet? Use the shared demo wallet</button>' : ""}
    <p class="note">Cardano <strong>preprod</strong> only. Signing proves the wallet is yours; it moves no funds.</p>
    <div class="msg" id="msg" role="status" aria-live="polite"></div>
  </section>
  <section class="done" id="done">
    <h1>You're connected</h1>
    <p id="doneText">Your agent's wallet:</p>
    <div class="addr" id="agent"></div>
    <p>Send it some tADA from your wallet (or the preprod faucet). Your agent can then buy, and every protected
      purchase is refunded automatically if the seller doesn't deliver.</p>
    <button class="wallet" id="continue" type="button" style="width:100%">Back to your agent</button>
  </section>
</main>
<script type="module">
  const request = ${JSON.stringify(o.request)};
  const $ = (id) => document.getElementById(id);
  const say = (text, kind = "") => { const m = $("msg"); m.textContent = text; m.className = "msg " + kind; };
  const limits = () => ({ maxPerPaymentAda: Number($("per").value), dailyBudgetAda: Number($("day").value) });

  async function approve(payload) {
    const res = await fetch("/oauth/approve", {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ request, ...limits(), ...payload }),
    });
    const out = await res.json();
    if (!res.ok) throw new Error(out.error || "Sign-in failed");
    $("ask").style.display = "none"; $("done").style.display = "block";
    $("agent").textContent = out.agentAddress;
    if (out.owner === "demo") $("doneText").textContent = "Your agent will use the shared demo wallet:";
    $("continue").onclick = () => location.assign(out.redirect);
    setTimeout(() => location.assign(out.redirect), 8000);
  }

  async function connect(key) {
    try {
      say("Opening your wallet…");
      const api = await window.cardano[key].enable();
      if ((await api.getNetworkId()) !== 0) throw new Error("Switch your wallet to the preprod testnet and try again.");
      const addressHex = await api.getChangeAddress();
      const c = await fetch("/oauth/challenge?request=" + encodeURIComponent(request) + "&address=" + encodeURIComponent(addressHex));
      const ch = await c.json();
      if (!c.ok) throw new Error(ch.error || "Couldn't start the sign-in");
      say("Sign the message in your wallet…");
      const sig = await api.signData(addressHex, ch.digest);
      await approve({ mode: "wallet", owner: ch.owner, key: sig.key, signature: sig.signature });
    } catch (e) { say(e?.info || e?.message || String(e), "err"); }
  }

  // Wallet extensions inject window.cardano a moment after load, so render again once they have.
  function renderWallets() {
    const found = Object.keys(window.cardano || {}).filter((k) => typeof window.cardano[k]?.enable === "function");
    const list = $("wallets");
    list.replaceChildren();
    if (found.length === 0) {
      list.innerHTML = '<p class="note">No Cardano wallet found in this browser. Install Eternl or Lace (set to preprod), or use the demo wallet.</p>';
      return;
    }
    for (const k of [...new Set(found)]) {
      const w = window.cardano[k];
      const b = document.createElement("button");
      b.className = "wallet"; b.type = "button";
      if (w.icon) { const i = document.createElement("img"); i.src = w.icon; i.alt = ""; b.append(i); }
      b.append("Sign in with " + (w.name || k));
      b.onclick = () => connect(k);
      list.append(b);
    }
  }
  renderWallets();
  addEventListener("load", () => setTimeout(renderWallets, 400));
  const demo = $("demo");
  if (demo) demo.onclick = () => approve({ mode: "demo" }).catch((e) => say(e.message, "err"));
</script>
</body>
</html>`;
