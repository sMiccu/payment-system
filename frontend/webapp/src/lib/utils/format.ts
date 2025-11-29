export const formatCurrency = (s: string): string => {
  const n = Number(s);
  if (Number.isNaN(n)) return s;
  return n.toLocaleString("ja-JP", {
    style: "currency",
    currency: "JPY",
    maximumFractionDigits: 0,
  });
};

export const formatDateTime = (datetime: string | null): string => {
  if (!datetime) return "--/-- --:--";
  const d = new Date(datetime);
  const yyyy = d.getFullYear();
  const mm = (d.getMonth() + 1).toString().padStart(2, "0");
  const dd = d.getDate().toString().padStart(2, "0");
  const hh = d.getHours().toString().padStart(2, "0");
  const mi = d.getMinutes().toString().padStart(2, "0");
  return `${yyyy}/${mm}/${dd} ${hh}:${mi}`;
};

export const formatMs = (msInput: number): string => {
  let ms = msInput;
  if (ms < 0) ms = 0;
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600)
    .toString()
    .padStart(2, "0");
  const minutes = Math.floor((totalSeconds % 3600) / 60)
    .toString()
    .padStart(2, "0");
  const seconds = Math.floor(totalSeconds % 60)
    .toString()
    .padStart(2, "0");
  return `${hours}:${minutes}:${seconds}`;
};

export const formatMinutes = (s: string): string => {
  const n = Number(s);
  if (Number.isNaN(n)) return `${s}分`;
  const totalMinutes = Math.floor(n);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  const seconds = Math.round((n - totalMinutes) * 60);

  const parts: string[] = [];
  if (hours > 0) parts.push(`${hours}時間`);
  if (minutes > 0) parts.push(`${minutes}分`);
  if (seconds > 0 && hours === 0) {
    parts.push(`${seconds}秒`);
  }
  if (parts.length === 0) return "0分";
  return parts.join("");
};


