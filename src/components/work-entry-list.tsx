import {
  formatDateLabel,
  formatDateTimeLabel,
  formatDurationLabel,
} from "@/features/time-entries/server";

type WorkEntry = {
  id: string;
  date: Date;
  start_hour: Date;
  end_hour: Date | null;
};

type WorkEntryListProps = {
  entries: WorkEntry[];
  emptyMessage: string;
};

export function WorkEntryList({ entries, emptyMessage }: WorkEntryListProps) {
  if (entries.length === 0) {
    return (
      <div className="rounded-[24px] border border-dashed border-[var(--brand-line)] bg-[var(--surface-strong)] p-6 text-sm text-[color:rgba(25,52,31,0.72)] shadow-sm">
        {emptyMessage}
      </div>
    );
  }

  return (
    <>
      <div className="grid gap-3 md:hidden">
        {entries.map((entry) => (
          <article
            key={entry.id}
            className="rounded-[24px] border border-[var(--brand-line)] bg-[var(--surface-strong)] p-4 shadow-sm"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-[var(--brand-deep)]">
                  {formatDateLabel(entry.date)}
                </p>
                <p className="mt-1 text-xs uppercase tracking-[0.18em] text-[color:rgba(25,52,31,0.46)]">
                  Work Entry
                </p>
              </div>
              <span className="rounded-full bg-[var(--brand-wash)] px-3 py-1 text-xs font-medium text-[var(--brand-deep)]">
                {formatDurationLabel(entry.start_hour, entry.end_hour)}
              </span>
            </div>

            <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-2xl bg-[var(--brand-wash)]/70 p-3">
                <dt className="text-[color:rgba(25,52,31,0.56)]">Start</dt>
                <dd className="mt-1 font-medium text-[var(--brand-deep)]">
                  {formatDateTimeLabel(entry.start_hour)}
                </dd>
              </div>
              <div className="rounded-2xl bg-[var(--brand-wash)]/70 p-3">
                <dt className="text-[color:rgba(25,52,31,0.56)]">End</dt>
                <dd className="mt-1 font-medium text-[var(--brand-deep)]">
                  {entry.end_hour ? formatDateTimeLabel(entry.end_hour) : "Not finished"}
                </dd>
              </div>
            </dl>
          </article>
        ))}
      </div>

      <div className="hidden overflow-hidden rounded-[24px] border border-[var(--brand-line)] bg-[var(--surface-strong)] shadow-sm md:block">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-[var(--brand-line)]">
            <thead className="bg-[var(--brand-wash)]">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[color:rgba(25,52,31,0.56)]">
                Day
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[color:rgba(25,52,31,0.56)]">
                Start
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[color:rgba(25,52,31,0.56)]">
                End
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[color:rgba(25,52,31,0.56)]">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--brand-soft)]">
            {entries.map((entry) => (
              <tr key={entry.id}>
                <td className="px-4 py-3 text-sm text-[var(--brand-deep)]">
                  {formatDateLabel(entry.date)}
                </td>
                <td className="px-4 py-3 text-sm text-[color:rgba(25,52,31,0.78)]">
                  {formatDateTimeLabel(entry.start_hour)}
                </td>
                <td className="px-4 py-3 text-sm text-[color:rgba(25,52,31,0.78)]">
                  {entry.end_hour ? formatDateTimeLabel(entry.end_hour) : "Not finished"}
                </td>
                <td className="px-4 py-3 text-sm font-medium text-[var(--brand-deep)]">
                  {formatDurationLabel(entry.start_hour, entry.end_hour)}
                </td>
              </tr>
            ))}
          </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
