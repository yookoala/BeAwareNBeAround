import { t } from '@lingui/core/macro';

export default function CustomItemList({ listId, items, placeholder, addLabel, onAdd, onRemove }) {
  return <><div id={listId}>{items.map((item) => <div key={item.id} className="input-group"><input type="text" className="form-control" placeholder={placeholder} aria-label={placeholder} style={{ paddingRight: '70px' }} /><button type="button" className="custom-remove" onClick={() => onRemove(item.id)}>{t({ id: 'profile.remove', message: 'Remove' })}</button></div>)}</div><button type="button" className="add-btn" onClick={onAdd}>{addLabel}</button></>;
}
