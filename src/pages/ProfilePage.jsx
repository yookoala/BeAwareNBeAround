import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ContactCard from '../components/diary/ContactCard';
import CustomItemList from '../components/diary/CustomItemList';
import InvestigationCard from '../components/diary/InvestigationCard';
import TagGroup from '../components/diary/TagGroup';
import usePageBodyClass from '../hooks/usePageBodyClass';
import { profileMessages } from './profileMessages';
import '../styles/profile.css';

function Accordion({ id, icon, title, children }) {
  const [open, setOpen] = useState(false);
  return <section className={`accordion-item${open ? ' active' : ''}`} data-testid={`accordion-${id}`}>
    <button type="button" className="accordion-header" aria-expanded={open} aria-controls={`profile-${id}`} onClick={() => setOpen(!open)}><span className="header-left"><span className="card-icon" aria-hidden="true">{icon}</span><span className="card-title">{title}</span></span><span className="toggle-icon" aria-hidden="true">▼</span></button>
    <div className="accordion-content" id={`profile-${id}`} hidden={!open}>{children}</div>
  </section>;
}
function Field({ label, placeholder }) {
  return <label className="label">{label}<input type="text" className="form-control" placeholder={placeholder} /></label>;
}

export default function ProfilePage() {
  const navigate = useNavigate();
  usePageBodyClass('page-profile');
  const m = profileMessages();
  const [saved, setSaved] = useState(false);
  const timer = useRef();
  const sequence = useRef(0);
  const [contacts, setContacts] = useState([{ id: 'initial', initial: true, phone: '' }]);
  const [investigations, setInvestigations] = useState([{ id: 'initial', initial: true }]);
  const [selected, setSelected] = useState([]);
  const [auras, setAuras] = useState([]);
  const [triggers, setTriggers] = useState([]);
  useEffect(() => () => clearTimeout(timer.current), []);
  function save() { clearTimeout(timer.current); setSaved(true); timer.current = setTimeout(() => setSaved(false), 2000); }
  function add(setter, extra = {}) { sequence.current += 1; setter((prev) => [...prev, { id: sequence.current, ...extra }]); }
  function remove(setter, id) { setter((prev) => prev.filter((item) => item.id !== id)); }
  function toggle(id) { setSelected((prev) => prev.includes(id) ? prev.filter((tag) => tag !== id) : [...prev, id]); }
  const tags = (prefix, count) => Array.from({ length: count }, (_, i) => m[`${prefix}${i + 1}`]);
  return <div className="app-container">
    <div className="diary-subheader"><button type="button" className="back-btn" onClick={() => navigate('/diary')}>{m.back}</button><h1 className="page-title">{m.title}</h1><button type="button" className="save-btn" onClick={save}>{m.save}</button></div>
    <Accordion id="basics" icon="🏥" title={m.basics}>
      <div className="row"><div className="col"><Field label={m.doctor} placeholder={m.doctorExample} /></div><div className="col"><Field label={m.hospital} placeholder={m.hospitalExample} /></div></div>
      <div className="input-group"><Field label={m.conditions} placeholder={m.conditionsPlaceholder} /></div><div className="input-group"><Field label={m.surgeries} placeholder={m.surgeriesPlaceholder} /></div><div className="input-group"><Field label={m.allergies} placeholder={m.allergiesPlaceholder} /></div>
    </Accordion>
    <Accordion id="meds" icon="💊" title={m.meds}><p>{m.medsHint}</p><button type="button" className="add-btn">{m.addMed}</button></Accordion>
    <Accordion id="contacts" icon="🆘" title={m.contacts}><div id="contact-list">{contacts.map((contact) => <ContactCard key={contact.id} contact={contact} onPhoneChange={(phone) => setContacts((prev) => prev.map((c) => c.id === contact.id ? { ...c, phone } : c))} onRemove={() => remove(setContacts, contact.id)} />)}</div><button type="button" className="add-btn" onClick={() => add(setContacts, { phone: '' })}>{m.addContact}</button></Accordion>
    <Accordion id="auras" icon="✨" title={m.auras}><TagGroup idPrefix="a" tags={tags('a', 8)} selected={selected} onToggle={toggle} /><CustomItemList listId="custom-aura-list" items={auras} placeholder={m.auraPlaceholder} addLabel={m.addAura} onAdd={() => add(setAuras)} onRemove={(id) => remove(setAuras, id)} /></Accordion>
    <Accordion id="triggers" icon="🎯" title={m.triggers}><div className="label">{m.triggerLabel}</div><TagGroup idPrefix="t" tags={tags('t', 7)} selected={selected} onToggle={toggle} /><div className="label">{m.lifeLabel}</div><TagGroup idPrefix="l" tags={tags('l', 8)} selected={selected} onToggle={toggle} /><CustomItemList listId="custom-trigger-list" items={triggers} placeholder={m.triggerPlaceholder} addLabel={m.addCustom} onAdd={() => add(setTriggers)} onRemove={(id) => remove(setTriggers, id)} /></Accordion>
    <Accordion id="investigations" icon="🔬" title={m.investigations}><div id="investigation-list">{investigations.map((investigation) => <InvestigationCard key={investigation.id} investigation={investigation} onRemove={() => remove(setInvestigations, investigation.id)} />)}</div><button type="button" className="add-btn" onClick={() => add(setInvestigations)}>{m.addInvestigation}</button></Accordion>
    {saved && <div role="status" className="profile-toast">{m.saved}</div>}
  </div>;
}
