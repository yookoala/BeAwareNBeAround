// Inline action badge on medication doses: [加量 ↑] / [減量 ↓] / [新增 +]
// (report-level-b.html's .action-tag).
export default function ActionTag({ tag }) {
  return <span className={`action-tag ${tag.cls}`}>{tag.label}</span>;
}
