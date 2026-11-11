import { describe, expect, it } from 'vitest';
import { activateLocale } from '../i18n/setup';
import {
  ENTRY_ICONS,
  entrySummary,
  entryTypeTitle,
  formatEntryTime,
  healthTagOptions,
  patternOptions,
  severityOptions,
  sideEffectTagOptions,
} from './entryPresentation';

const clusterSeizure = { severity: 'minor', pattern: 'cluster', clusterCount: 3, auras: ['visual'], triggers: ['stress'], notes: '' };

describe('entryPresentation', () => {
  it('maps an icon per record type', () => {
    expect(ENTRY_ICONS).toMatchObject({ seizure: '⚡', headache: '🤕', health: '⏳', sideEffects: '😵‍💫' });
  });

  it('formats the stored wall-clock time for display', () => {
    expect(formatEntryTime('2026-09-15T16:00')).toBe('2026-09-15 16:00');
  });

  it('reuses the existing localized type titles', () => {
    activateLocale('en');
    expect(entryTypeTitle('seizure')).toBe('Seizure record');
    expect(entryTypeTitle('headache')).toBe('Headache record');
    expect(entryTypeTitle('sideEffects')).toBe('Side effects');
    expect(entryTypeTitle('health')).toBe('Physiology and health');
    activateLocale('zh-HK');
    expect(entryTypeTitle('health')).toBe('生理及健康');
  });

  describe('shared form option lists', () => {
    it('provides the seizure and headache severity/pattern options the forms use', () => {
      activateLocale('en');
      expect(severityOptions(false)).toEqual([
        { value: 'major', label: 'Major seizure' },
        { value: 'minor', label: 'Minor seizure' },
      ]);
      expect(severityOptions(true)).toEqual([
        { value: 'major', label: 'Severe headache' },
        { value: 'minor', label: 'Mild/moderate headache' },
      ]);
      expect(patternOptions(false)).toEqual([
        { value: 'single', label: 'Single seizure' },
        { value: 'cluster', label: 'Cluster / repeated seizures' },
      ]);
      expect(patternOptions(true)).toEqual([
        { value: 'single', label: 'Single headache' },
        { value: 'cluster', label: 'Cluster / repeated headaches' },
      ]);
    });

    it('provides the built-in side-effect and health tag options the forms use', () => {
      activateLocale('en');
      expect(sideEffectTagOptions().map((tag) => tag.id)).toEqual([
        'drowsiness', 'dizziness', 'tremor', 'memory', 'mood', 'rash', 'gi', 'weight',
      ]);
      expect(sideEffectTagOptions().find((tag) => tag.id === 'tremor').label).toBe('Hand tremor');
      expect(healthTagOptions().map((tag) => tag.id)).toEqual(['period', 'urti', 'surgery', 'stress']);
      activateLocale('zh-HK');
      expect(healthTagOptions()[1].label).toBe('傷風感冒 (URTI)');
    });
  });

  describe('entrySummary', () => {
    it('summarizes seizures as severity · pattern with ×N on clusters', () => {
      activateLocale('en');
      expect(entrySummary({ type: 'seizure', data: clusterSeizure })).toBe('Minor seizure · Cluster / repeated seizures ×3');
      expect(entrySummary({ type: 'seizure', data: { ...clusterSeizure, pattern: 'single' } })).toBe('Minor seizure · Single seizure');
      activateLocale('zh-HK');
      expect(entrySummary({ type: 'seizure', data: clusterSeizure })).toBe('小發作 · 叢集 / 連續多次 ×3');
    });

    it('uses the headache labels on headache entries', () => {
      activateLocale('en');
      expect(entrySummary({ type: 'headache', data: { severity: 'major', pattern: 'single', clusterCount: 2 } }))
        .toBe('Severe headache · Single headache');
    });

    it('joins the first two side-effect labels and counts the rest', () => {
      activateLocale('en');
      expect(entrySummary({ type: 'sideEffects', data: { selected: [{ id: 'drowsiness' }, { id: 'tremor' }], notes: '' } }))
        .toBe('Drowsiness/fatigue · Hand tremor');
      expect(entrySummary({ type: 'sideEffects', data: { selected: [{ id: 'drowsiness' }, { id: 'tremor' }, { id: 'memory' }], notes: '' } }))
        .toBe('Drowsiness/fatigue · Hand tremor (+1 more)');
      expect(entrySummary({ type: 'sideEffects', data: { selected: [{ id: 'custom-1', label: 'Blurred vision' }], notes: '' } }))
        .toBe('Blurred vision');
      activateLocale('zh-CN');
      expect(entrySummary({ type: 'sideEffects', data: { selected: [{ id: 'drowsiness' }, { id: 'tremor' }, { id: 'memory' }], notes: '' } }))
        .toBe('嗜睡/疲倦 · 手部震颤 (+1 项)');
    });

    it('counts health custom items as tags', () => {
      activateLocale('en');
      expect(entrySummary({ type: 'health', data: { selectedTags: ['period'], customItems: ['Intense training'], notes: '' } }))
        .toBe('Menstrual period · Intense training');
      expect(entrySummary({ type: 'health', data: { selectedTags: ['period', 'urti'], customItems: ['Intense training'], notes: '' } }))
        .toBe('Menstrual period · Cold (URTI) (+1 more)');
      activateLocale('zh-HK');
      expect(entrySummary({ type: 'health', data: { selectedTags: ['period', 'urti'], customItems: ['高強度訓練'], notes: '' } }))
        .toBe('女性生理期 · 傷風感冒 (URTI) (+1 項)');
    });

    it('falls back to the notes when nothing is selected', () => {
      activateLocale('en');
      expect(entrySummary({ type: 'health', data: { selectedTags: [], customItems: [], notes: 'Only remarks' } }))
        .toBe('Only remarks');
      expect(entrySummary({ type: 'health', data: { selectedTags: [], customItems: [], notes: '' } }))
        .toBe('');
    });
  });
});
