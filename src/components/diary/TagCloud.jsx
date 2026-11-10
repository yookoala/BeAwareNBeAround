export default function TagCloud({ tags, selected, onToggle }) {
  return (
    <div className="tag-cloud">
      {tags.map((tag) => (
        <button key={tag.id} type="button" className={`tag${selected.includes(tag.id) ? ' selected' : ''}`}
          aria-pressed={selected.includes(tag.id)} onClick={() => onToggle(tag.id)}>
          {tag.label}
        </button>
      ))}
    </div>
  );
}
