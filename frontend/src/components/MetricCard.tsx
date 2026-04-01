type MetricCardProps = {
  label: string;
  value: string;
  helper?: string;
  accent?: "warm" | "cool" | "neutral";
};

export function MetricCard({ label, value, helper, accent = "neutral" }: MetricCardProps) {
  return (
    <div className={`metric-card accent-${accent}`}>
      <p>{label}</p>
      <strong>{value}</strong>
      {helper ? <span>{helper}</span> : null}
    </div>
  );
}
