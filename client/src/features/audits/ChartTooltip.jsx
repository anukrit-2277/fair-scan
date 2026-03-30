const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="audit-tooltip">
      <p className="audit-tooltip__label">{label}</p>
      {payload.map((entry, i) => (
        <div key={i} className="audit-tooltip__row">
          <span className="audit-tooltip__dot" style={{ background: entry.color }} />
          <span>{entry.name}</span>
          <span className="audit-tooltip__value">
            {typeof entry.value === 'number' ? (entry.value * 100).toFixed(1) + '%' : entry.value}
          </span>
        </div>
      ))}
    </div>
  );
};

export default ChartTooltip;
