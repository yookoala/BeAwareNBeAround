// Shared per-type presentation for stored diary entries (PLAN12 M19): the
// dashboard cards, the full list (M19-004) and the detail view (M19-005) all
// render entries through these helpers, and the event forms get their option
// labels from here too, so label strings have exactly one source.
import { t } from '@lingui/core/macro';
import { i18n } from '../i18n/setup';

export const ENTRY_ICONS = {
  seizure: '⚡',
  headache: '🤕',
  health: '⏳',
  sideEffects: '😵‍💫',
};

export function entryTypeTitle(type) {
  switch (type) {
    case 'headache':
      return t({ id: 'diary.headache', message: 'Headache record' });
    case 'health':
      return t({ id: 'diary.health', message: 'Physiology and health' });
    case 'sideEffects':
      return t({ id: 'diary.sideEffects', message: 'Side effects' });
    case 'seizure':
    default:
      return t({ id: 'diary.seizure', message: 'Seizure record' });
  }
}

export function severityOptions(isHeadache) {
  return isHeadache
    ? [
        { value: 'major', label: t({ id: 'diary.headacheLog.major', message: 'Severe headache' }) },
        { value: 'minor', label: t({ id: 'diary.headacheLog.minor', message: 'Mild/moderate headache' }) },
      ]
    : [
        { value: 'major', label: t({ id: 'diary.eventLog.major', message: 'Major seizure' }) },
        { value: 'minor', label: t({ id: 'diary.eventLog.minor', message: 'Minor seizure' }) },
      ];
}

export function patternOptions(isHeadache) {
  return isHeadache
    ? [
        { value: 'single', label: t({ id: 'diary.headacheLog.single', message: 'Single headache' }) },
        { value: 'cluster', label: t({ id: 'diary.headacheLog.cluster', message: 'Cluster / repeated headaches' }) },
      ]
    : [
        { value: 'single', label: t({ id: 'diary.eventLog.single', message: 'Single seizure' }) },
        { value: 'cluster', label: t({ id: 'diary.eventLog.cluster', message: 'Cluster / repeated seizures' }) },
      ];
}

export function sideEffectTagOptions() {
  return [
    { id: 'drowsiness', label: t({ id: 'diary.sideEffects.drowsiness', message: 'Drowsiness/fatigue' }) },
    { id: 'dizziness', label: t({ id: 'diary.sideEffects.dizziness', message: 'Dizziness/unsteadiness' }) },
    { id: 'tremor', label: t({ id: 'diary.sideEffects.tremor', message: 'Hand tremor' }) },
    { id: 'memory', label: t({ id: 'diary.sideEffects.memory', message: 'Memory/concentration decline' }) },
    { id: 'mood', label: t({ id: 'diary.sideEffects.mood', message: 'Mood swings/irritability' }) },
    { id: 'rash', label: t({ id: 'diary.sideEffects.rash', message: 'Skin rash/allergy' }) },
    { id: 'gi', label: t({ id: 'diary.sideEffects.gi', message: 'Nausea/GI upset' }) },
    { id: 'weight', label: t({ id: 'diary.sideEffects.weight', message: 'Weight change' }) },
  ];
}

export function healthTagOptions() {
  return [
    { id: 'period', label: t({ id: 'diary.healthState.period', message: 'Menstrual period' }) },
    { id: 'urti', label: t({ id: 'diary.healthState.urti', message: 'Cold (URTI)' }) },
    { id: 'surgery', label: t({ id: 'diary.healthState.surgery', message: 'Surgery' }) },
    { id: 'stress', label: t({ id: 'diary.healthState.stress', message: 'Extreme sadness/stress' }) },
  ];
}

export function formatEntryTime(time) {
  // Entry times are stored as datetime-local wall-clock strings; the cards
  // show them space-separated.
  return time.replace('T', ' ');
}

function optionLabel(options, value) {
  return options.find((option) => option.value === value)?.label ?? value;
}

function tagLabel(options, item) {
  // Custom side-effect selections persist their label next to the id.
  if (typeof item === 'object' && item.label) return item.label;
  const id = typeof item === 'object' ? item.id : item;
  return options.find((tag) => tag.id === id)?.label ?? id;
}

export function entrySummary(entry) {
  const { type, data } = entry;

  if (type === 'seizure' || type === 'headache') {
    const isHeadache = type === 'headache';
    const pattern = optionLabel(patternOptions(isHeadache), data.pattern);
    const cluster = data.pattern === 'cluster' ? ` ×${data.clusterCount}` : '';
    return `${optionLabel(severityOptions(isHeadache), data.severity)} · ${pattern}${cluster}`;
  }

  const labels = type === 'health'
    ? [...data.selectedTags.map((id) => tagLabel(healthTagOptions(), id)), ...data.customItems]
    : data.selected.map((item) => tagLabel(sideEffectTagOptions(), item));

  const head = labels.slice(0, 2).join(' · ');
  const extra = labels.length - 2;
  if (extra > 0) {
    const more = i18n._({ id: 'diary.recent.moreCount', message: '+{count} more' }, { count: extra });
    return `${head} (${more})`;
  }
  return head || (data.notes ?? '');
}
