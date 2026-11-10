import { useEffect, useState } from 'react';
import { t } from '@lingui/core/macro';
import { useNavigate } from 'react-router-dom';
import OptionGroup from '../components/diary/OptionGroup';
import TagCloud from '../components/diary/TagCloud';
import usePageBodyClass from '../hooks/usePageBodyClass';
import '../styles/event-log.css';

export default function EventLogPage() {
  const navigate = useNavigate();
  usePageBodyClass('page-event-log');
  const [severity, setSeverity] = useState('major');
  const [pattern, setPattern] = useState('single');
  const [auras, setAuras] = useState([]);
  const [triggers, setTriggers] = useState([]);
  const [clusterCount, setClusterCount] = useState(2);
  const [saveCount, setSaveCount] = useState(0);

  useEffect(() => {
    if (!saveCount) return undefined;
    const timer = setTimeout(() => setSaveCount(0), 2000);
    return () => clearTimeout(timer);
  }, [saveCount]);

  function selectPattern(value) {
    setPattern(value);
    if (value === 'single') setClusterCount(2);
  }
  function toggleAura(id) {
    setAuras((previous) => {
      if (previous.includes(id)) return previous.filter((item) => item !== id);
      if (id === 'none') return [id];
      return [...previous.filter((item) => item !== 'none'), id];
    });
  }
  function toggleTrigger(id) {
    setTriggers((previous) => previous.includes(id) ? previous.filter((item) => item !== id) : [...previous, id]);
  }
  const severityOptions = [
    { value: 'major', label: t({ id: 'diary.eventLog.major', message: 'Major seizure' }) },
    { value: 'minor', label: t({ id: 'diary.eventLog.minor', message: 'Minor seizure' }) },
  ];
  const patternOptions = [
    { value: 'single', label: t({ id: 'diary.eventLog.single', message: 'Single seizure' }) },
    { value: 'cluster', label: t({ id: 'diary.eventLog.cluster', message: 'Cluster / repeated seizures' }) },
  ];
  const auraTags = [
    { id: 'none', label: t({ id: 'diary.eventLog.aura.none', message: 'No Aura' }) },
    { id: 'visual', label: t({ id: 'diary.eventLog.aura.visual', message: 'Visual (e.g. flashing lights/hallucinations)' }) },
    { id: 'sensory', label: t({ id: 'diary.eventLog.aura.sensory', message: 'Physical sensations (e.g. numbness/tingling)' }) },
    { id: 'auditory', label: t({ id: 'diary.eventLog.aura.auditory', message: 'Auditory (e.g. ringing/noise)' }) },
    { id: 'psychic', label: t({ id: 'diary.eventLog.aura.psychic', message: 'Psychological (e.g. fear/déjà vu)' }) },
    { id: 'smell-taste', label: t({ id: 'diary.eventLog.aura.smellTaste', message: 'Smell/taste (unpleasant smells)' }) },
    { id: 'abdominal', label: t({ id: 'diary.eventLog.aura.abdominal', message: 'Abdominal (discomfort/rising sensation)' }) },
    { id: 'autonomic', label: t({ id: 'diary.eventLog.aura.autonomic', message: 'Autonomic (palpitations/sweating)' }) },
  ];
  const triggerTags = [
    { id: 'sleep', label: t({ id: 'diary.eventLog.trigger.sleep', message: 'Sleep deprivation' }) },
    { id: 'medication', label: t({ id: 'diary.eventLog.trigger.medication', message: 'Missed medication' }) },
    { id: 'stress', label: t({ id: 'diary.eventLog.trigger.stress', message: 'Stress/tension' }) },
    { id: 'illness', label: t({ id: 'diary.eventLog.trigger.illness', message: 'Fever/cold' }) },
    { id: 'menstruation', label: t({ id: 'diary.eventLog.trigger.menstruation', message: 'Menstruation' }) },
    { id: 'alcohol', label: t({ id: 'diary.eventLog.trigger.alcohol', message: 'Alcohol' }) },
    { id: 'weather', label: t({ id: 'diary.eventLog.trigger.weather', message: 'Weather changes' }) },
    { id: 'light', label: t({ id: 'diary.eventLog.trigger.light', message: 'Bright/flashing lights' }) },
  ];

  return (
    <div className="app-container">
      <div className="diary-subheader">
        <button type="button" className="back-btn" onClick={() => navigate('/diary')}>{t({ id: 'diary.eventLog.cancel', message: '← Cancel' })}</button>
        <div className="header-title">{t({ id: 'diary.eventLog.title', message: 'New Entry' })}</div>
        <button type="button" className="save-btn" onClick={() => setSaveCount((count) => count + 1)}>{t({ id: 'diary.eventLog.save', message: 'Save' })}</button>
      </div>
      <div className="form-section" style={{ marginTop: 0, borderTop: 'none' }}>
        <label className="section-header" htmlFor="event-time">{t({ id: 'diary.eventLog.time', message: 'Seizure time' })}</label>
        <input id="event-time" type="datetime-local" className="datetime-picker" defaultValue="2026-09-17T17:30" />
      </div>
      <div className="form-section">
        <div className="section-header">{t({ id: 'diary.eventLog.severityPattern', message: 'Seizure severity and pattern' })}</div>
        <OptionGroup id="severity-group" options={severityOptions} value={severity} onSelect={setSeverity} />
        <OptionGroup id="pattern-group" options={patternOptions} value={pattern} onSelect={selectPattern} />
        <div className={`cluster-counter${pattern === 'cluster' ? ' show' : ''}`} id="cluster-counter" hidden={pattern !== 'cluster'}>
          <span className="stepper-label">{t({ id: 'diary.eventLog.estimatedCount', message: 'Estimated number of seizures' })}</span>
          <div className="stepper-controls">
            <button type="button" className="step-btn" aria-label={t({ id: 'diary.eventLog.decrease', message: 'Decrease seizure count' })} onClick={() => setClusterCount((count) => Math.max(2, count - 1))}>−</button>
            <span className="step-value" id="attack-count">{clusterCount}</span>
            <button type="button" className="step-btn" aria-label={t({ id: 'diary.eventLog.increase', message: 'Increase seizure count' })} onClick={() => setClusterCount((count) => count + 1)}>+</button>
          </div>
        </div>
      </div>
      <div className="form-section">
        <div className="section-header">{t({ id: 'diary.eventLog.auras', message: 'Auras (select all that apply)' })}</div>
        <TagCloud tags={auraTags} selected={auras} onToggle={toggleAura} />
      </div>
      <div className="form-section">
        <div className="section-header">{t({ id: 'diary.eventLog.triggers', message: 'Triggers (select all that apply)' })}</div>
        <TagCloud tags={triggerTags} selected={triggers} onToggle={toggleTrigger} />
      </div>
      <div className="form-section" style={{ marginBottom: '24px' }}>
        <label className="section-header" htmlFor="event-notes">{t({ id: 'diary.eventLog.notes', message: 'Seizure description / notes' })}</label>
        <textarea id="event-notes" className="textarea-box" placeholder={t({ id: 'diary.eventLog.notesPlaceholder', message: 'For example: left hand twitching, confused for about 2 minutes...' })} />
        <div className="help-text">{t({ id: 'diary.eventLog.videoHelp', message: '💡 If you just made an emergency recording, the video will be attached below automatically.' })}</div>
      </div>
      {saveCount > 0 && <div role="status" className="event-log-toast">{t({ id: 'diary.eventLog.saved', message: 'Entry saved!' })}</div>}
    </div>
  );
}
