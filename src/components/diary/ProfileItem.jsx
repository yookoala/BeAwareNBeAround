// Label/value card mirroring report-level-b.html's .profile-item: column
// card, `row` variant (two side-by-side sub-items, inline style verbatim),
// or grid-column span for wide items.
export default function ProfileItem({ item }) {
  if (item.row) {
    return (
      <div
        className="profile-item"
        style={{ display: 'flex', flexDirection: 'row', gap: '12px', justifyContent: 'space-between' }}
      >
        {item.items.map((sub) => (
          <div key={sub.label}>
            <span className="label">{sub.label}</span>
            <span className="value">{sub.value}</span>
          </div>
        ))}
      </div>
    );
  }
  return (
    <div
      className="profile-item"
      style={item.span ? { gridColumn: `span ${item.span}` } : undefined}
    >
      <span className="label">{item.label}</span>
      <span className="value">{item.value}</span>
    </div>
  );
}
