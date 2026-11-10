import { useEffect, useRef, useState } from 'react';
import { t } from '@lingui/core/macro';
import { useNavigate } from 'react-router-dom';
import CustomItemList from '../components/diary/CustomItemList';
import Modal from '../components/diary/Modal';
import TagCloud from '../components/diary/TagCloud';
import usePageBodyClass from '../hooks/usePageBodyClass';
import { navigateWithViewTransition } from '../utils/viewTransition';
import '../styles/event-log.css';

const DEFAULT_DATETIME = '2026-09-17T17:30';

export default function HealthStatePage() {
  const navigate = useNavigate();
  usePageBodyClass('page-event-log');
  const [eventTime, setEventTime] = useState(DEFAULT_DATETIME);
  const [selected, setSelected] = useState([]);
  const [customItems, setCustomItems] = useState([]);
  const [notes, setNotes] = useState('');
  const [isDirty, setIsDirty] = useState(false);
  const [leaveConfirmOpen, setLeaveConfirmOpen] = useState(false);
  const [saveCount, setSaveCount] = useState(0);
  const customSeq = useRef(0);

  useEffect(() => {
    if (!saveCount) return undefined;
    const timer = setTimeout(() => setSaveCount(0), 2000);
    return () => clearTimeout(timer);
  }, [saveCount]);

  const healthTags = [
    { id: 'period', label: t({ id: 'diary.healthState.period', message: 'Menstrual period' }) },
    { id: 'urti', label: t({ id: 'diary.healthState.urti', message: 'Cold (URTI)' }) },
    { id: 'surgery', label: t({ id: 'diary.healthState.surgery', message: 'Surgery' }) },
    { id: 'stress', label: t({ id: 'diary.healthState.stress', message: 'Extreme sadness/stress' }) },
  ];

  function toggleTag(id) {
    setIsDirty(true);
    setSelected((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
  }

  function addCustomItem() {
    customSeq.current += 1;
    setCustomItems((prev) => [...prev, { id: `custom-health-${customSeq.current}` }]);
    setIsDirty(true);
  }

  function removeCustomItem(id) {
    setCustomItems((prev) => prev.filter((item) => item.id !== id));
    setIsDirty(true);
  }

  function handleSave() {
    setIsDirty(false);
    setSaveCount((count) => count + 1);
  }

  function leaveToMenu() {
    setLeaveConfirmOpen(false);
    navigateWithViewTransition(navigate, '/diary/event', 'vt-slide-out-right');
  }

  function handleBack() {
    if (isDirty) {
      setLeaveConfirmOpen(true);
      return;
    }
    leaveToMenu();
  }

  return (
    <div className="app-container">
      <header className="diary-subheader">
        <button type="button" className="back-btn" onClick={handleBack}>{t({ id: 'diary.eventLog.back', message: '← Back' })}</button>
        <div className="header-title">{t({ id: 'diary.healthTitle', message: 'Physiological and health conditions' })}</div>
        <button type="button" className="save-btn" onClick={handleSave}>{t({ id: 'diary.eventLog.save', message: 'Save' })}</button>
      </header>
      <div className="form-section" style={{ marginTop: 0, borderTop: 'none' }}>
        <label className="section-header" htmlFor="event-time">{t({ id: 'diary.recordTime', message: 'Record time' })}</label>
        <input
          id="event-time"
          type="datetime-local"
          className="datetime-picker"
          value={eventTime}
          onChange={(e) => {
            setEventTime(e.target.value);
            setIsDirty(true);
          }}
        />
      </div>
      <div className="form-section">
        <div className="section-header">{t({ id: 'diary.healthState.selectTitle', message: 'Health conditions (select all that apply)' })}</div>
        <TagCloud tags={healthTags} selected={selected} onToggle={toggleTag} />
        <div style={{ marginTop: '12px' }}>
          <CustomItemList
            listId="custom-health-list"
            items={customItems}
            placeholder={t({ id: 'diary.healthState.customPlaceholder', message: 'Enter custom condition...' })}
            addLabel={t({ id: 'diary.healthState.addCustom', message: '+ Add custom condition' })}
            onAdd={addCustomItem}
            onRemove={removeCustomItem}
          />
        </div>
      </div>
      <div className="form-section" style={{ marginBottom: '24px' }}>
        <label className="section-header" htmlFor="health-notes">{t({ id: 'diary.healthState.notes', message: 'Health condition notes' })}</label>
        <textarea
          id="health-notes"
          className="textarea-box"
          value={notes}
          onChange={(e) => {
            setNotes(e.target.value);
            setIsDirty(true);
          }}
          placeholder={t({ id: 'diary.healthState.notesPlaceholder', message: 'Enter any additional physiological or health remarks...' })}
        />
      </div>
      {leaveConfirmOpen && (
        <Modal
          id="leaveConfirmModal"
          title={t({ id: 'diary.eventLog.unsavedTitle', message: 'Unsaved changes' })}
          onClose={() => setLeaveConfirmOpen(false)}
        >
          <p className="unsaved-warning-text">
            {t({ id: 'diary.eventLog.unsavedPrompt', message: 'Are you sure you want to leave without saving?' })}
          </p>
          <div className="unsaved-actions">
            <button type="button" className="unsaved-stay-btn" onClick={() => setLeaveConfirmOpen(false)}>
              {t({ id: 'diary.eventLog.stay', message: 'Stay' })}
            </button>
            <button type="button" className="unsaved-leave-btn" onClick={leaveToMenu}>
              {t({ id: 'diary.eventLog.leave', message: 'Leave' })}
            </button>
          </div>
        </Modal>
      )}
      {saveCount > 0 && <div role="status" className="event-log-toast">{t({ id: 'diary.eventLog.saved', message: 'Entry saved!' })}</div>}
    </div>
  );
}
