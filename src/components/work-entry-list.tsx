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
      <div className="rounded-lg border border-dashed bg-white p-6 text-sm text-gray-600 shadow-sm dark:border-gray-800 dark:bg-black dark:text-gray-400">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border bg-white shadow-sm dark:border-gray-800 dark:bg-black">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
          <thead className="bg-gray-50 dark:bg-zinc-950">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                Day
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                Start
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                End
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-900">
            {entries.map((entry) => (
              <tr key={entry.id}>
                <td className="px-4 py-3 text-sm text-black dark:text-white">
                  {formatDateLabel(entry.date)}
                </td>
                <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                  {formatDateTimeLabel(entry.start_hour)}
                </td>
                <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                  {entry.end_hour ? formatDateTimeLabel(entry.end_hour) : "Not finished"}
                </td>
                <td className="px-4 py-3 text-sm font-medium text-black dark:text-white">
                  {formatDurationLabel(entry.start_hour, entry.end_hour)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
