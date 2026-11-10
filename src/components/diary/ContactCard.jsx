import { t } from '@lingui/core/macro';
import { contactHrefs } from '../../utils/contactLinks';

export default function ContactCard({ contact, onPhoneChange, onRemove }) {
  const hrefs = contactHrefs(contact.phone, t({ id: 'diary.profile.contactEmergencyMsg', message: 'Emergency notice: I may currently be experiencing a seizure, please assist me.' }));

  return (
    <div className="contact-card">
      {!contact.initial && (
        <button type="button" className="remove-btn" onClick={onRemove}>
          {t({ id: 'profile.remove', message: 'Remove' })}
        </button>
      )}
      <div className="row">
        <div className="col">
          <label className="label">
            {t({ id: 'profile.name', message: 'Name' })}
            <input
              type="text"
              className="form-control"
              placeholder={contact.initial ? t({ id: 'profile.contact1', message: 'Contact 1' }) : t({ id: 'profile.contact', message: 'Contact' })}
            />
          </label>
        </div>
        <div className="col">
          <label className="label">
            {t({ id: 'profile.relationship', message: 'Relationship' })}
            <input
              type="text"
              className="form-control"
              placeholder={contact.initial ? t({ id: 'profile.father', message: 'e.g. Father' }) : t({ id: 'profile.relationship', message: 'Relationship' })}
            />
          </label>
        </div>
      </div>
      <div className="input-group">
        <label className="label">
          {contact.initial ? t({ id: 'profile.phoneExample', message: 'Phone (include country code, e.g. 85298765432)' }) : t({ id: 'profile.phone', message: 'Phone' })}
          <input
            type="tel"
            className="form-control phone-input"
            placeholder="85298765432"
            value={contact.phone}
            onChange={(e) => onPhoneChange(e.target.value)}
          />
        </label>
      </div>
      <div className="action-links">
        <a href={hrefs.call} className="action-link bg-call call-link">📞 {t({ id: 'profile.call', message: 'Call' })}</a>
        <a href={hrefs.sms} className="action-link bg-sms sms-link">💬 SMS</a>
        <a href={hrefs.wa} className="action-link bg-wa wa-link">🟢 WhatsApp</a>
      </div>
    </div>
  );
}
