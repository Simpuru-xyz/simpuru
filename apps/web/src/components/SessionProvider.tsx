"use client";

import { Loader2, Wallet } from "lucide-react";
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import Modal from "@/components/Modal";
import {
  fetchMe,
  loadSession,
  type Me,
  type Session,
  SignedOut,
  saveSession,
  signInChallenge,
  signInVerify,
  signOutRemote,
} from "@/lib/account";
import { formatAda } from "@/lib/api";
import { connectWallet, listWallets, type WalletInfo, walletMessage } from "@/lib/wallet";

type SessionValue = {
  /** null while signed out; `me` is null until the first /me answer. */
  session: Session | null;
  me: Me | null;
  /** True until we know whether a stored session is still good. */
  restoring: boolean;
  refresh: () => Promise<void>;
  openSignIn: () => void;
  signOut: () => void;
  /** Wraps an API call: a 401 signs out and reopens Sign in. */
  guard: <T>(call: (token: string) => Promise<T>) => Promise<T>;
};

const Ctx = createContext<SessionValue | null>(null);

export function useSession() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useSession outside SessionProvider");
  return v;
}

const REFRESH_MS = 20_000;

/**
 * Sign in with Cardano (spec #86, J1): a CIP-30 wallet signs a one-time challenge and the API
 * returns a session token, kept in localStorage and sent as a Bearer on every call. Also keeps
 * `/me` fresh (balance every 20 s) and announces deposits.
 */
export default function SessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [me, setMe] = useState<Me | null>(null);
  const [restoring, setRestoring] = useState(true);
  const [modal, setModal] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const lastBalance = useRef<bigint | null>(null);
  // The token whose /me answers we accept; a late answer after sign-out or a switch is dropped.
  const current = useRef<string | null>(null);

  const clear = useCallback(() => {
    current.current = null;
    saveSession(null);
    setSession(null);
    setMe(null);
    lastBalance.current = null;
  }, []);

  const load = useCallback(
    async (s: Session) => {
      try {
        const next = await fetchMe(s.token);
        if (current.current !== s.token) return;
        const bal = BigInt(next.wallet.balanceLovelace);
        if (lastBalance.current !== null && bal > lastBalance.current)
          setToast(`+${formatAda((bal - lastBalance.current).toString())} tADA arrived`);
        lastBalance.current = bal;
        setMe(next);
      } catch (err) {
        if (err instanceof SignedOut && current.current === s.token) clear();
      }
    },
    [clear],
  );

  useEffect(() => {
    // Keys from the old address-field and per-listing-signature flows; no longer read.
    try {
      localStorage.removeItem("simpuru:seller-address");
      localStorage.removeItem("simpuru:wallet");
    } catch {}
    const s = loadSession();
    if (!s) {
      setRestoring(false);
      return;
    }
    current.current = s.token;
    setSession(s);
    load(s).finally(() => setRestoring(false));
  }, [load]);

  useEffect(() => {
    if (!session) return;
    const t = setInterval(() => load(session), REFRESH_MS);
    return () => clearInterval(t);
  }, [session, load]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 5000);
    return () => clearTimeout(t);
  }, [toast]);

  const signedIn = useCallback(
    async (s: Session) => {
      saveSession(s);
      current.current = s.token;
      lastBalance.current = null;
      setSession(s);
      setModal(false);
      await load(s);
    },
    [load],
  );

  const signOut = useCallback(() => {
    if (session) signOutRemote(session.token);
    clear();
  }, [session, clear]);

  const guard = useCallback(
    async <T,>(call: (token: string) => Promise<T>) => {
      if (!session) {
        setModal(true);
        throw new SignedOut(401, "Sign in first.");
      }
      try {
        return await call(session.token);
      } catch (err) {
        if (err instanceof SignedOut) {
          clear();
          setModal(true);
        }
        throw err;
      }
    },
    [session, clear],
  );

  const value: SessionValue = {
    session,
    me,
    restoring,
    refresh: async () => {
      if (session) await load(session);
    },
    openSignIn: () => setModal(true),
    signOut,
    guard,
  };

  return (
    <Ctx.Provider value={value}>
      {children}
      <SignInModal open={modal} onClose={() => setModal(false)} onSignedIn={signedIn} />
      {toast && (
        <div
          role="status"
          className="animate-fade-in-up fixed right-4 bottom-4 z-50 rounded-full bg-black px-4 py-2.5 text-sm font-medium text-white shadow-lg"
        >
          {toast}
        </div>
      )}
    </Ctx.Provider>
  );
}

function SignInModal({
  open,
  onClose,
  onSignedIn,
}: {
  open: boolean;
  onClose: () => void;
  onSignedIn: (s: Session) => Promise<void>;
}) {
  const [wallets, setWallets] = useState<WalletInfo[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");

  // Rescan on open: extensions inject window.cardano a moment after page load.
  useEffect(() => {
    if (!open) return;
    setWallets(listWallets());
    setError("");
    const t = setTimeout(() => setWallets(listWallets()), 400);
    return () => clearTimeout(t);
  }, [open]);

  const signIn = async (key: string) => {
    setBusy(key);
    setError("");
    try {
      const wallet = await connectWallet(key);
      const { owner, digest } = await signInChallenge(wallet.hex);
      const { key: coseKey, signature } = await wallet.api.signData(wallet.hex, digest);
      const { token, expiresAt } = await signInVerify(owner, coseKey, signature);
      await onSignedIn({ token, expiresAt, owner });
    } catch (err) {
      setError(walletMessage(err));
    } finally {
      setBusy(null);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Sign in with your Cardano wallet" locked={!!busy}>
      <p className="text-sm text-gray-600">
        Your wallet signs a one-time message to prove it&apos;s yours. No funds move. Set the wallet
        to preprod.
      </p>
      {wallets.length === 0 ? (
        <p className="rounded-xl border border-gray-200 p-4 text-sm text-gray-600">
          No Cardano wallet found in this browser. Install{" "}
          <a href="https://eternl.io" target="_blank" rel="noreferrer" className="underline">
            Eternl
          </a>{" "}
          or{" "}
          <a href="https://www.lace.io" target="_blank" rel="noreferrer" className="underline">
            Lace
          </a>
          , switch it to preprod, then reload.
        </p>
      ) : (
        <div className="grid gap-2">
          {wallets.map((w) => (
            <button
              key={w.key}
              type="button"
              disabled={!!busy}
              onClick={() => signIn(w.key)}
              className="flex items-center gap-3 rounded-xl border border-gray-200 px-4 py-3 text-left text-sm font-medium transition-colors hover:border-black disabled:opacity-60"
            >
              {busy === w.key ? (
                <Loader2 aria-hidden className="h-5 w-5 animate-spin" />
              ) : w.icon ? (
                // biome-ignore lint/performance/noImgElement: wallet icons are data URIs from the extension
                <img src={w.icon} alt="" className="h-5 w-5" />
              ) : (
                <Wallet aria-hidden className="h-5 w-5" />
              )}
              {busy === w.key ? "Sign the message in your wallet…" : w.name}
            </button>
          ))}
        </div>
      )}
      {error && (
        <p
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-800"
        >
          {error}
        </p>
      )}
    </Modal>
  );
}
