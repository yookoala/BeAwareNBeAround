import { t } from '@lingui/core/macro';

export default function InvestigationCard({ investigation, onRemove }) {
  const types = [['EEG', t({ id: 'profile.eeg', message: 'Electroencephalogram (EEG)' })], ['MRI', t({ id: 'profile.mri', message: 'MRI' })], ['CT', t({ id: 'profile.ct', message: 'CT scan' })], ['Blood', t({ id: 'profile.blood', message: 'Blood test' })], ['Genetic', t({ id: 'profile.genetic', message: 'Genetic test' })], ['Other', t({ id: 'profile.other', message: 'Other' })]];
  return <div className="investigation-card">
    {!investigation.initial && <button type="button" className="remove-btn" onClick={onRemove}>{t({ id: 'profile.remove', message: 'Remove' })}</button>}
    <div className="row"><div className="col"><label className="label">{t({ id: 'profile.type', message: 'Type' })}<select className="form-control">{types.map(([value, name]) => <option value={value} key={value}>{name}</option>)}</select></label></div><div className="col"><label className="label">{t({ id: 'profile.date', message: 'Date' })}<input type="date" className="form-control" /></label></div></div>
    <div className="row"><div className="col"><label className="label">{t({ id: 'profile.status', message: 'Status' })}<select className="form-control"><option value="NotAvailable">{t({ id: 'profile.notAvailable', message: 'Not available' })}</option><option value="Available">{t({ id: 'profile.available', message: 'Available' })}</option></select></label></div><div className="col"><label className="label">{t({ id: 'profile.result', message: 'Result' })}<select className="form-control"><option value="Normal">{t({ id: 'profile.normal', message: 'Normal' })}</option><option value="NotNormal">{t({ id: 'profile.notNormal', message: 'Not normal' })}</option></select></label></div></div>
    <div className="input-group"><label className="label">{t({ id: 'profile.remark', message: 'Remark' })}<input type="text" className="form-control" placeholder={t({ id: 'profile.remarkPlaceholder', message: 'Brief description...' })} /></label></div>
  </div>;
}
