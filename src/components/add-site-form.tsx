"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { Check, Copy, Globe2, KeyRound, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { PageHeader, Panel } from "@/components/ui";
import { apiRequest } from "@/lib/api";

type CreatedSite = {
  site: { id: string; name: string };
  credential: { id: string; keyPrefix: string };
  secret: string;
};

export function AddSiteForm() {
  const router = useRouter();
  const [created, setCreated] = useState<CreatedSite>();
  const [copied, setCopied] = useState<string>();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string>();

  async function copy(value: string, key: string) {
    await navigator.clipboard.writeText(value);
    setCopied(key);
    window.setTimeout(() => setCopied(undefined), 1600);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    setPending(true);
    setError(undefined);
    const form = new FormData(formElement);
    try {
      const result = await apiRequest<CreatedSite>("/api/internal/sites", {
        method: "POST",
        body: JSON.stringify({
          name: form.get("name"),
          domain: form.get("domain"),
          environment: form.get("environment"),
          securityMode: form.get("securityMode"),
          retentionDays: Number(form.get("retentionDays")),
        }),
      });
      setCreated(result);
      formElement.reset();
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Website could not be created");
    } finally {
      setPending(false);
    }
  }

  function finish() {
    setCreated(undefined);
    setCopied(undefined);
    router.push("/dashboard/sites");
  }

  return <div className="page">
    <PageHeader eyebrow="Sites / New" title="Connect a website" description="Register a trusted origin and issue its first collector credential." backHref="/dashboard/sites" />
    <form className="form-shell" onSubmit={submit}>
      <Panel>
        <div className="form-section">
          <h2 className="form-heading">Website details</h2>
          <p className="form-help">Use the public origin where security events will originate.</p>
          <div className="field-grid">
            <div className="field"><label htmlFor="site-name">Display name</label><input className="input" id="site-name" name="name" placeholder="e.g. Aurora Commerce" minLength={2} maxLength={80} required /></div>
            <div className="field"><label htmlFor="environment">Environment</label><select className="input" id="environment" name="environment" defaultValue="PRODUCTION"><option value="PRODUCTION">Production</option><option value="STAGING">Staging</option><option value="DEVELOPMENT">Development</option></select></div>
            <div className="field full"><label htmlFor="domain">Website origin</label><input className="input" id="domain" name="domain" type="url" inputMode="url" placeholder="https://app.example.com" required /><span className="field-note">HTTPS is required, except localhost in Development.</span></div>
          </div>
        </div>
        <div className="form-section">
          <h2 className="form-heading">Collection policy</h2>
          <p className="form-help">The site remains pending until collector verification is implemented.</p>
          <div className="field-grid">
            <div className="field"><label htmlFor="security-mode">Security mode</label><select className="input" id="security-mode" name="securityMode" defaultValue="MONITOR_ONLY"><option value="MONITOR_ONLY">Monitor only</option><option value="MONITOR_AND_ENFORCE">Monitor and enforce</option></select></div>
            <div className="field"><label htmlFor="retention">Event retention</label><select className="input" id="retention" name="retentionDays" defaultValue="90"><option value="30">30 days</option><option value="90">90 days</option><option value="180">180 days</option></select></div>
          </div>
        </div>
        <div className="form-section form-actions">{error && <p className="form-error" role="alert">{error}</p>}<button className="button primary" type="submit" disabled={pending}><Globe2 size={14} />{pending ? "Creating…" : "Create website"}</button></div>
      </Panel>
      <aside className="aside-note"><KeyRound size={16} /><h3>One-time secret</h3><p>The generated secret is shown once. Only its SHA-256 hash and a safe prefix are stored.</p></aside>
    </form>
    <Dialog.Root open={Boolean(created)} onOpenChange={(open) => { if (!open) finish(); }}>
      <Dialog.Portal><Dialog.Overlay className="drawer-overlay" /><Dialog.Content className="panel credential-dialog" aria-describedby="credential-description">
        <button className="icon-button dialog-close" type="button" onClick={finish} aria-label="Close"><X size={17} /></button>
        <div className="empty-icon dialog-success"><Check size={20} /></div>
        <Dialog.Title className="dialog-title">Website created</Dialog.Title>
        <Dialog.Description id="credential-description" className="page-description">Copy both values now. The full secret cannot be retrieved after this dialog closes.</Dialog.Description>
        {created && <div className="credential-list">
          {[["Site ID", created.site.id, "site"], ["Secret key", created.secret, "secret"]].map(([label, value, key]) => <div key={key}><div className="strip-label credential-label">{label}</div><div className="code-block credential-value"><span>{value}</span><button type="button" onClick={() => copy(value, key)} className="icon-button code-copy" aria-label={`Copy ${label}`}>{copied === key ? <Check size={14} /> : <Copy size={14} />}</button></div></div>)}
        </div>}
        <div className="dialog-actions"><button className="button primary" type="button" onClick={finish}>I saved the secret</button></div>
      </Dialog.Content></Dialog.Portal>
    </Dialog.Root>
  </div>;
}
