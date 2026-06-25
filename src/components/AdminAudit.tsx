import type { AuditEvent } from '../types';

interface Props {
  events: AuditEvent[];
}

const ACTION_LABELS: Record<AuditEvent['action'], string> = {
  create: 'Created',
  set: 'Saved',
  update: 'Updated',
  delete: 'Deleted',
};

const ACTION_CLASSES: Record<AuditEvent['action'], string> = {
  create: 'border-emerald-800 bg-emerald-950 text-emerald-200',
  set: 'border-blue-800 bg-blue-950 text-blue-200',
  update: 'border-amber-800 bg-amber-950 text-amber-200',
  delete: 'border-red-800 bg-red-950 text-red-200',
};

export default function AdminAudit({ events }: Props) {
  return (
    <div className="space-y-4">
      <div className="card">
        <h3 className="font-semibold">Audit Trail</h3>
        <p className="mt-1 text-sm text-slate-400">
          Latest 100 app data changes. Each row stores the document path, changed fields, actor, and before/after payloads.
        </p>
      </div>

      {events.length === 0 && (
        <div className="card text-sm text-slate-400">No audit events have been recorded yet.</div>
      )}

      <div className="space-y-3">
        {events.map((event) => (
          <div key={event.id} className="card space-y-3">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`rounded-full border px-2 py-1 text-xs font-semibold ${ACTION_CLASSES[event.action]}`}>
                    {ACTION_LABELS[event.action]}
                  </span>
                  <span className="font-mono text-sm text-slate-200">{event.documentPath}</span>
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  {formatDate(event.createdAt)} by {formatActor(event)}
                </p>
              </div>
              <span className="rounded-full border border-slate-700 bg-slate-900 px-2 py-1 text-xs text-slate-400">
                {event.collectionName}
              </span>
            </div>

            {event.changedFields.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {event.changedFields.map((field) => (
                  <span key={field} className="rounded border border-slate-700 bg-slate-900 px-2 py-1 font-mono text-xs text-slate-300">
                    {field}
                  </span>
                ))}
              </div>
            )}

            <details className="rounded-lg border border-slate-700 bg-slate-950/50">
              <summary className="cursor-pointer px-3 py-2 text-sm font-semibold text-slate-300">
                Payload
              </summary>
              <div className="grid gap-3 border-t border-slate-700 p-3 lg:grid-cols-2">
                <PayloadBlock title="Before" value={event.before} />
                <PayloadBlock title="After" value={event.after} />
              </div>
            </details>
          </div>
        ))}
      </div>
    </div>
  );
}

function PayloadBlock({ title, value }: { title: string; value: unknown }) {
  return (
    <div>
      <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">{title}</p>
      <pre className="max-h-80 overflow-auto rounded-lg bg-slate-950 p-3 text-xs text-slate-300">
        {JSON.stringify(value, null, 2)}
      </pre>
    </div>
  );
}

function formatDate(value: number) {
  if (!value) return 'Unknown time';
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

function formatActor(event: AuditEvent) {
  if (event.actor.email) return event.actor.email;
  if (event.actor.displayName) return event.actor.displayName;
  if (event.actor.uid) return event.actor.uid;
  return event.actor.isAuthenticated ? 'Signed-in user' : 'Unauthenticated app user';
}
