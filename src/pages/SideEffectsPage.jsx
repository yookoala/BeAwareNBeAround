import { useEffect, useState } from 'react';
import { t } from '@lingui/core/macro';
import { useNavigate } from 'react-router-dom';
import Modal from '../components/diary/Modal';
import TagCloud from '../components/diary/TagCloud';
import usePageBodyClass from '../hooks/usePageBodyClass';
import { navigateWithViewTransition } from '../utils/viewTransition';
import { addEntry } from '../services/diaryEntries';
import { localNowValue } from '../utils/localNowValue';
import '../styles/event-log.css';

export default function SideEffectsPage() {
  const navigate = useNavigate();
  usePageBodyClass('page-event-log');
  const [eventTime, setEventTime] = useState(localNowValue);
  const [selected, setSelected] = useState([]);
  const [removedIds, setRemovedIds] = useState([]);
  const [customTags, setCustomTags] = useState([]);
  const [managing, setManaging] = useState(false);
  const [newSideEffect, setNewSideEffect] = useState('');
  const [notes, setNotes] = useState('');
  const [isDirty, setIsDirty] = useState(false);
  const [leaveConfirmOpen, setLeaveConfirmOpen] = useState(false);
  const [saveCount, setSaveCount] = useState(0);
  const [errorCount, setErrorCount] = useState(0);

  useEffect(() => {
    if (!saveCount) return undefined;
    const timer = setTimeout(() => setSaveCount(0), 2000);
    return () => clearTimeout(timer);
  }, [saveCount]);

  useEffect(() => {
    if (!errorCount) return undefined;
    const timer = setTimeout(() => setErrorCount(0), 2000);
    return () => clearTimeout(timer);
  }, [errorCount]);

  const builtInTags = [
    { id: 'drowsiness', label: t({ id: 'diary.sideEffects.drowsiness', message: 'Drowsiness/fatigue' }) },
    { id: 'dizziness', label: t({ id: 'diary.sideEffects.dizziness', message: 'Dizziness/unsteadiness' }) },
    { id: 'tremor', label: t({ id: 'diary.sideEffects.tremor', message: 'Hand tremor' }) },
    { id: 'memory', label: t({ id: 'diary.sideEffects.memory', message: 'Memory/concentration decline' }) },
    { id: 'mood', label: t({ id: 'diary.sideEffects.mood', message: 'Mood swings/irritability' }) },
    { id: 'rash', label: t({ id: 'diary.sideEffects.rash', message: 'Skin rash/allergy' }) },
    { id: 'gi', label: t({ id: 'diary.sideEffects.gi', message: 'Nausea/GI upset' }) },
    { id: 'weight', label: t({ id: 'diary.sideEffects.weight', message: 'Weight change' }) },
  ];

  const allTags = [
    ...builtInTags.filter((tag) => !removedIds.includes(tag.id)),
    ...customTags,
  ];

  function toggleTag(id) {
    setIsDirty(true);
    setSelected((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
  }

  function addSideEffect() {
    const label = newSideEffect.trim();
    if (!label) return;
    // Ids are persisted in entry records from M19-002 on, so they must be
    // collision-free across edits (the old per-mount custom-se-N counter
    // would collide with stored ids).
    const id = crypto.randomUUID();
    setCustomTags((prev) => [...prev, { id, label }]);
    setNewSideEffect('');
    setIsDirty(true);
  }

  function removeSideEffect(id) {
    setIsDirty(true);
    setSelected((prev) => prev.filter((item) => item !== id));
    if (customTags.some((item) => item.id === id)) {
      setCustomTags((prev) => prev.filter((item) => item.id !== id));
    } else {
      setRemovedIds((prev) => [...prev, id]);
    }
  }

  async function handleSave() {
    try {
      await addEntry({
        type: 'sideEffects',
        time: eventTime,
        data: {
          selected: selected.map((id) => {
            const custom = customTags.find((item) => item.id === id);
            return custom ? { id, label: custom.label } : { id };
          }),
          notes,
        },
      });
      setIsDirty(false);
      setSaveCount((count) => count + 1);
    } catch {
      setErrorCount((count) => count + 1);
    }
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
        <div className="header-title">{t({ id: 'diary.sideEffects', message: 'Side effects' })}</div>
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
        <div className="section-header">
          <span>{t({ id: 'diary.sideEffects.commonTitle', message: 'Common side effects (select all that apply)' })}</span>
          <button
            type="button"
            className="manage-btn"
            onClick={() => setManaging((prev) => !prev)}
          >
            {managing
              ? t({ id: 'diary.sideEffects.manageDone', message: 'Done' })
              : t({ id: 'diary.sideEffects.manage', message: 'Manage side effects' })}
          </button>
        </div>
        {!managing ? (
          <TagCloud tags={allTags} selected={selected} onToggle={toggleTag} />
        ) : (
          <div className="side-effect-manage-panel">
            <div className="tag-cloud">
              {allTags.map((tag) => {
                const removeLabel = `${t({ id: 'diary.sideEffects.removePrefix', message: 'Remove' })} ${tag.label}`;
                return (
                  <div key={tag.id} className="side-effect-manage-chip">
                    <span>{tag.label}</span>
                    <button
                      type="button"
                      className="chip-remove-btn"
                      aria-label={removeLabel}
                      onClick={() => removeSideEffect(tag.id)}
                    >
                      ×
                    </button>
                  </div>
                );
              })}
            </div>
            <div className="side-effect-add-row">
              <input
                id="new-side-effect-input"
                type="text"
                className="form-control"
                value={newSideEffect}
                onChange={(e) => setNewSideEffect(e.target.value)}
                placeholder={t({ id: 'diary.sideEffects.addPlaceholder', message: 'Enter new side effect...' })}
              />
              <button type="button" className="add-btn" onClick={addSideEffect}>
                {t({ id: 'diary.sideEffects.addBtn', message: '+ Add side effect' })}
              </button>
            </div>
          </div>
        )}
      </div>
      <div className="form-section" style={{ marginBottom: '24px' }}>
        <label className="section-header" htmlFor="side-effect-notes">{t({ id: 'diary.sideEffects.notes', message: 'Extra observations / notes' })}</label>
        <textarea
          id="side-effect-notes"
          className="textarea-box"
          value={notes}
          onChange={(e) => {
            setNotes(e.target.value);
            setIsDirty(true);
          }}
          placeholder={t({ id: 'diary.sideEffects.notesPlaceholder', message: 'For example: occurred 2 hours after taking medication...' })}
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
      {errorCount > 0 && <div role="status" className="event-log-toast">{t({ id: 'diary.eventLog.saveError', message: 'Could not save the record. Storage is unavailable on this device.' })}</div>}
    </div>
  );
}
