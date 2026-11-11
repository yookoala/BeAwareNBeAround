import { t } from '@lingui/core/macro';

export default function CustomItemList({ listId, items, placeholder, addLabel, onAdd, onRemove, onItemChange }) {
  // Items are { id, value }; inputs stay uncontrolled (defaultValue only) so
  // typing behavior is unchanged while values become readable page state.
  return <><div id={listId}>{items.map((item) => <div key={item.id} className="input-group"><input type="text" className="form-control" placeholder={placeholder} aria-label={placeholder} defaultValue={item.value} style={{ paddingRight: '70px' }} onChange={(e) => onItemChange?.(item.id, e.target.value)} /><button type="button" className="custom-remove" onClick={() => onRemove(item.id)}>{t({ id: 'profile.remove', message: 'Remove' })}</button></div>)}</div><button type="button" className="add-btn" onClick={onAdd}>{addLabel}</button></>;
}
