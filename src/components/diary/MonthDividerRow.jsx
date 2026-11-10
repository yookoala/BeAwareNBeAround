// Full-width month divider row inside a DataTable body
// (report-level-b.html's `<td colspan="N" class="month-divider">`).
export default function MonthDividerRow({ label, colSpan }) {
  return (
    <tr>
      <td colSpan={colSpan} className="month-divider">
        {label}
      </td>
    </tr>
  );
}
