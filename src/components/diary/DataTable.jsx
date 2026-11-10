// Data table mirroring report-level-b.html's table.data-table: header row
// from column specs (label + inline width), body rows passed as children.
export default function DataTable({ columns, children }) {
  return (
    <table className="data-table">
      <thead>
        <tr>
          {columns.map((column) => (
            <th key={column.label} style={{ width: column.width }}>
              {column.label}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>{children}</tbody>
    </table>
  );
}
