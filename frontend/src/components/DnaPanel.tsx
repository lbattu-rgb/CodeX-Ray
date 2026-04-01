type DnaPanelProps = {
  dna: Record<string, string>;
};

export function DnaPanel({ dna }: DnaPanelProps) {
  const entries = Object.entries(dna);
  return (
    <section className="panel">
      <div className="panel-header compact">
        <div>
          <p className="eyebrow">Behavioral Fingerprint</p>
          <h3>Complexity DNA</h3>
        </div>
      </div>
      <div className="dna-grid">
        {entries.map(([key, value]) => (
          <div key={key} className="dna-cell">
            <span>{key.split("_").join(" ")}</span>
            <strong>{value}</strong>
          </div>
        ))}
      </div>
    </section>
  );
}
