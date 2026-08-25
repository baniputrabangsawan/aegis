"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { Check, Copy, KeyRound, Plus, RotateCw, ShieldOff, X } from "lucide-react";
import { FormEvent, useMemo, useState } from "react";
import { apiRequest } from "@/lib/api";
import { PageHeader, Panel, StatStrip, StatusBadge } from "@/components/ui";

type SiteOption = { id: string; name: string; environment: string };
type ApiKeyRecord = {
  id: string; siteId: string; name: string; keyPrefix: string; environment: string;
  createdAt: string; lastUsedAt: string | null; expiresAt: string | null; revokedAt: string | null;
  site: { name: string };
};
type Reveal = { credential: { id: string; name: string; keyPrefix: string }; secret: string };

function statusOf(key: ApiKeyRecord) {
  if (key.revokedAt) return "Revoked";
  if (key.expiresAt && new Date(key.expiresAt) <= new Date()) return "Expired";
  return "Active";
}

function date(value: string | null, fallback = "Never") {
  return value ? new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value)) : fallback;
}

export function ApiKeysPage({ initialKeys, sites }: { initialKeys: ApiKeyRecord[]; sites: SiteOption[] }) {
  const [keys, setKeys] = useState(initialKeys);
  const [open, setOpen] = useState(false);
  const [reveal, setReveal] = useState<Reveal>();
  const [pending, setPending] = useState<string>();
  const [error, setError] = useState<string>();
  const [copied, setCopied] = useState(false);

  const stats = useMemo(() => ({
    active: keys.filter((key) => statusOf(key) === "Active").length,
    production: keys.filter((key) => statusOf(key) === "Active" && key.environment === "PRODUCTION").length,
    test: keys.filter((key) => statusOf(key) === "Active" && key.environment !== "PRODUCTION").length,
    revoked: keys.filter((key) => statusOf(key) === "Revoked").length,
  }), [keys]);

  async function reload() {
    setKeys(await apiRequest<ApiKeyRecord[]>("/api/internal/api-keys", { cache: "no-store" }));
  }

  async function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setPending("create"); setError(undefined);
    try {
      const result = await apiRequest<Reveal>("/api/internal/api-keys", { method: "POST", body: JSON.stringify({ name: form.get("name"), siteId: form.get("siteId"), environment: form.get("environment") }) });
      setReveal(result);
      await reload();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "API key could not be created"); }
    finally { setPending(undefined); }
  }

  async function rotate(key: ApiKeyRecord) {
    if (!window.confirm(`Rotate ${key.name}? The current key will stop working immediately.`)) return;
    setPending(key.id); setError(undefined);
    try {
      const result = await apiRequest<Reveal>(`/api/internal/api-keys/${key.id}/rotate`, { method: "POST" });
      setReveal(result); setOpen(true); await reload();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "API key could not be rotated"); }
    finally { setPending(undefined); }
  }

  async function revoke(key: ApiKeyRecord) {
    if (!window.confirm(`Revoke ${key.name}? Requests using it will be rejected.`)) return;
    setPending(key.id); setError(undefined);
    try { await apiRequest(`/api/internal/api-keys/${key.id}/revoke`, { method: "POST" }); await reload(); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "API key could not be revoked"); }
    finally { setPending(undefined); }
  }

  function close() { setOpen(false); setReveal(undefined); setCopied(false); setError(undefined); }

  return <div className="page">
    <PageHeader eyebrow="Developer" title="API keys" description="Issue, rotate, and revoke website-scoped collector credentials. Full secrets are revealed only once." />
    <StatStrip items={[{ label: "Active keys", value: String(stats.active) }, { label: "Production", value: String(stats.production) }, { label: "Test / development", value: String(stats.test) }, { label: "Revoked", value: String(stats.revoked) }]} />
    {error && <p className="form-error page-error" role="alert">{error}</p>}
    <Panel title="Site credentials" subtitle="The database stores a SHA-256 hash and safe prefix—not the plaintext secret" action={<button className="button primary" onClick={() => { setReveal(undefined); setOpen(true); }} disabled={sites.length === 0}><Plus size={14} />Create key</button>}>
      {keys.length === 0 ? <div className="empty-state"><div><div className="empty-icon"><KeyRound size={19} /></div><h3>No API keys yet</h3><p>Create a website to receive its first key, or issue another key from this page.</p></div></div> : <>
        <div className="table-scroll api-key-table"><table className="data-table"><thead><tr><th>Name</th><th>Key prefix</th><th>Website</th><th>Environment</th><th>Last used</th><th>Created</th><th>Status</th><th><span className="sr-only">Actions</span></th></tr></thead><tbody>{keys.map((key) => <tr key={key.id}><td className="cell-primary">{key.name}</td><td className="mono">{key.keyPrefix}…</td><td>{key.site.name}</td><td>{key.environment.toLowerCase()}</td><td>{date(key.lastUsedAt)}</td><td>{date(key.createdAt)}</td><td><StatusBadge>{statusOf(key)}</StatusBadge></td><td><div className="row-actions"><button className="icon-button" onClick={() => rotate(key)} disabled={statusOf(key) !== "Active" || pending === key.id} aria-label={`Rotate ${key.name}`} title="Rotate"><RotateCw size={14} /></button><button className="icon-button danger-icon" onClick={() => revoke(key)} disabled={statusOf(key) !== "Active" || pending === key.id} aria-label={`Revoke ${key.name}`} title="Revoke"><ShieldOff size={14} /></button></div></td></tr>)}</tbody></table></div>
        <div className="mobile-list api-key-mobile">{keys.map((key) => <article className="mobile-card" key={key.id}><div className="mobile-card-top"><div><div className="mobile-card-title">{key.name}</div><div className="mobile-card-subtitle mono">{key.keyPrefix}…</div></div><StatusBadge>{statusOf(key)}</StatusBadge></div><div className="mobile-card-grid"><div><div className="mobile-card-label">Website</div><div className="mobile-card-value">{key.site.name}</div></div><div><div className="mobile-card-label">Environment</div><div className="mobile-card-value">{key.environment.toLowerCase()}</div></div></div><div className="mobile-key-actions"><button className="button" onClick={() => rotate(key)} disabled={statusOf(key) !== "Active"}>Rotate</button><button className="button danger" onClick={() => revoke(key)} disabled={statusOf(key) !== "Active"}>Revoke</button></div></article>)}</div>
      </>}
    </Panel>
    <Dialog.Root open={open} onOpenChange={(next) => { if (!next) close(); }}><Dialog.Portal><Dialog.Overlay className="drawer-overlay" /><Dialog.Content className="panel credential-dialog" aria-describedby="key-description">
      <button className="icon-button dialog-close" type="button" onClick={close} aria-label="Close"><X size={17} /></button>
      <div className="empty-icon dialog-success"><KeyRound size={19} /></div>
      <Dialog.Title className="dialog-title">{reveal ? "Save your secret key" : "Create API key"}</Dialog.Title>
      <Dialog.Description id="key-description" className="page-description">{reveal ? "This is the only time the full secret will be displayed." : "Issue a separate credential when an integration needs independent rotation or revocation."}</Dialog.Description>
      {reveal ? <><div className="credential-list"><div><div className="strip-label credential-label">Key prefix</div><div className="code-block">{reveal.credential.keyPrefix}…</div></div><div><div className="strip-label credential-label">Secret key</div><div className="code-block credential-value"><span>{reveal.secret}</span><button className="icon-button code-copy" type="button" onClick={async () => { await navigator.clipboard.writeText(reveal.secret); setCopied(true); }} aria-label="Copy secret">{copied ? <Check size={14} /> : <Copy size={14} />}</button></div></div></div><div className="dialog-actions"><button className="button primary" type="button" onClick={close}>I saved the secret</button></div></> : <form onSubmit={create}><div className="field-grid dialog-fields"><div className="field full"><label htmlFor="key-name">Key name</label><input id="key-name" name="name" className="input" placeholder="e.g. Production collector" minLength={2} maxLength={80} required /></div><div className="field"><label htmlFor="key-site">Website</label><select id="key-site" name="siteId" className="input" required>{sites.map((site) => <option key={site.id} value={site.id}>{site.name}</option>)}</select></div><div className="field"><label htmlFor="key-env">Environment</label><select id="key-env" name="environment" className="input" defaultValue="PRODUCTION"><option value="PRODUCTION">Production</option><option value="STAGING">Staging</option><option value="DEVELOPMENT">Development</option></select></div></div>{error && <p className="form-error dialog-error" role="alert">{error}</p>}<div className="dialog-actions"><button className="button" type="button" onClick={close}>Cancel</button><button className="button primary" type="submit" disabled={pending === "create"}>{pending === "create" ? "Creating…" : "Create key"}</button></div></form>}
    </Dialog.Content></Dialog.Portal></Dialog.Root>
  </div>;
}
