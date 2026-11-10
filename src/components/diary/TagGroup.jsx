import { Fragment } from 'react';

export default function TagGroup({ idPrefix, tags, selected, onToggle }) {
  return <div className="tag-group">{tags.map((tag, index) => {
    const id = `${idPrefix}${index + 1}`;
    return <Fragment key={id}><input type="checkbox" id={id} className="tag-checkbox" checked={selected.includes(id)} onChange={() => onToggle(id)} /><label htmlFor={id} className="tag-label">{tag}</label></Fragment>;
  })}</div>;
}
