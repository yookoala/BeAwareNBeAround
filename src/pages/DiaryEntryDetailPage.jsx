import { useCallback, useEffect, useState } from 'react';
import { t } from '@lingui/core/macro';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import ConfirmDialog from '../components/diary/ConfirmDialog';
import usePageBodyClass from '../hooks/usePageBodyClass';
import { navigateWithViewTransition } from '../utils/viewTransition';
import {
  auraTagOptions,
  entryTags,
  entryTypeTitle,
  formatEntryTime,
  patternOptions,
  severityOptions,
  triggerTagOptions,
} from '../utils/entryPresentation';
import { deleteEntry, getEntry } from '../services/diaryEntries';
import '../styles/entry-detail.css';

// Each record type is edited through its own form route; the detail page's
// Edit button hands off to it with ?edit=<id> (M19-006 fills the form).
const EDIT_ROUTES = {
  seizure: '/diary/event/seizure',
  headache: '/diary/event/headache',
  sideEffects: '/diary/event/side-effects',
  health: '/diary/event/health',
};

export default function DiaryEntryDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  usePageBodyClass('page-diary-entry-detail');
  const [entry, setEntry] = useState(null);
  const [status, setStatus] = useState('loading'); // loading | ready | missing | error
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteFailed, setDeleteFailed] = useState(false);
  // Set by M19-006's edit-save via router navigation state.
  const [savedToast, setSavedToast] = useState(Boolean(location.state?.saved));

  const load = useCallback(() => {
    getEntry(id)
      .then((found) => {
        if (found) {
          setEntry(found);
          setStatus('ready');
        } else {
          setStatus('missing');
        }
      })
      .catch(() => setStatus('error'));
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!savedToast) return undefined;
    const timer = setTimeout(() => setSavedToast(false), 2000);
    return () => clearTimeout(timer);
  }, [savedToast]);

  function goBack() {
    navigateWithViewTransition(navigate, -1, 'vt-slide-out-right');
  }

  function openEdit() {
    navigateWithViewTransition(navigate, `${EDIT_ROUTES[entry.type]}?edit=${entry.id}`, 'vt-slide-in-right');
  }

  function confirmDelete() {
    deleteEntry(entry.id)
      .then(() => {
        setDeleteOpen(false);
        navigateWithViewTransition(navigate, '/diary/entries', 'vt-slide-out-right', { state: { deleted: true } });
      })
      .catch(() => {
        setDeleteOpen(false);
        setDeleteFailed(true);
      });
  }

  function optionLabel(options, value) {
    return options.find((option) => option.value === value)?.label ?? value;
  }

  function tagLabel(options, value) {
    return options.find((tag) => tag.id === value)?.label ?? value;
  }

  return (
    <div className="app-container" id="appContainer">
      <div className="diary-subheader">
        <button type="button" className="back-btn" onClick={goBack}>{t({ id: 'diary.eventLog.back', message: '← Back' })}</button>
        <div className="header-title">{entry ? entryTypeTitle(entry.type) : t({ id: 'diary.entries.title', message: 'All entries' })}</div>
        {entry ? (
          <button type="button" className="edit-btn" onClick={openEdit}>{t({ id: 'diary.entry.edit', message: 'Edit' })}</button>
        ) : <span className="edit-btn-spacer" />}
      </div>

      {status === 'loading' ? null : status === 'error' ? (
        <p className="recent-records-unavailable">{t({ id: 'diary.recordsUnavailable', message: 'Records unavailable — this device could not open its diary storage.' })}</p>
      ) : status === 'missing' ? (
        <p className="entry-not-found">{t({ id: 'diary.entry.notFound', message: 'Record not found on this device.' })}</p>
      ) : (
        <>
          <div className="form-section">
            <div className="section-header">{t({ id: 'diary.recordTime', message: 'Record time' })}</div>
            <div className="entry-detail-value">{formatEntryTime(entry.time)}</div>
          </div>

          {(entry.type === 'seizure' || entry.type === 'headache') && (
            <>
              <div className="form-section">
                <div className="section-header">
                  {entry.type === 'headache'
                    ? t({ id: 'diary.headacheLog.severityPattern', message: 'Headache severity and pattern' })
                    : t({ id: 'diary.eventLog.severityPattern', message: 'Seizure severity and pattern' })}
                </div>
                <div className="tag-cloud">
                  <span className="tag selected">{optionLabel(severityOptions(entry.type === 'headache'), entry.data.severity)}</span>
                  <span className="tag selected">{optionLabel(patternOptions(entry.type === 'headache'), entry.data.pattern)}</span>
                  {entry.data.pattern === 'cluster' && <span className="tag selected">×{entry.data.clusterCount}</span>}
                </div>
              </div>
              {entry.data.auras.length > 0 && (
                <div className="form-section">
                  <div className="section-header">{t({ id: 'diary.entry.auras', message: 'Auras' })}</div>
                  <div className="tag-cloud">
                    {entry.data.auras.map((aura) => <span key={aura} className="tag selected">{tagLabel(auraTagOptions(), aura)}</span>)}
                  </div>
                </div>
              )}
              {entry.data.triggers.length > 0 && (
                <div className="form-section">
                  <div className="section-header">{t({ id: 'diary.entry.triggers', message: 'Triggers' })}</div>
                  <div className="tag-cloud">
                    {entry.data.triggers.map((trigger) => <span key={trigger} className="tag selected">{tagLabel(triggerTagOptions(), trigger)}</span>)}
                  </div>
                </div>
              )}
            </>
          )}

          {(entry.type === 'sideEffects' || entry.type === 'health') && entryTags(entry).length > 0 && (
            <div className="form-section">
              <div className="section-header">
                {entry.type === 'health'
                  ? t({ id: 'diary.entry.healthTitle', message: 'Health conditions recorded' })
                  : t({ id: 'diary.entry.sideEffectsTitle', message: 'Side effects recorded' })}
              </div>
              <div className="tag-cloud">
                {entryTags(entry).map((label) => <span key={label} className="tag selected">{label}</span>)}
              </div>
            </div>
          )}

          {entry.data.notes && (
            <div className="form-section">
              <div className="section-header">
                {entry.type === 'headache'
                  ? t({ id: 'diary.headacheLog.notes', message: 'Headache description / notes' })
                  : entry.type === 'seizure'
                    ? t({ id: 'diary.eventLog.notes', message: 'Seizure description / notes' })
                    : entry.type === 'sideEffects'
                      ? t({ id: 'diary.sideEffects.notes', message: 'Extra observations / notes' })
                      : t({ id: 'diary.healthState.notes', message: 'Health condition notes' })}
              </div>
              <div className="entry-detail-notes">{entry.data.notes}</div>
            </div>
          )}

          <button type="button" className="delete-btn" onClick={() => { setDeleteFailed(false); setDeleteOpen(true); }}>
            {t({ id: 'diary.entry.delete', message: 'Delete entry' })}
          </button>
        </>
      )}

      {deleteOpen && (
        <ConfirmDialog
          id="deleteConfirmModal"
          title={t({ id: 'diary.entry.deleteTitle', message: 'Delete entry?' })}
          prompt={t({ id: 'diary.entry.deletePrompt', message: 'Are you sure you want to delete this entry? It will be permanently removed from this device.' })}
          cancelLabel={t({ id: 'diary.entry.deleteCancel', message: 'Cancel' })}
          confirmLabel={t({ id: 'diary.entry.deleteConfirm', message: 'Delete' })}
          onCancel={() => setDeleteOpen(false)}
          onConfirm={confirmDelete}
        />
      )}

      {savedToast && <div role="status" className="entry-toast">{t({ id: 'diary.eventLog.saved', message: 'Entry saved!' })}</div>}
      {deleteFailed && <div role="status" className="entry-toast">{t({ id: 'diary.recordsUnavailable', message: 'Records unavailable — this device could not open its diary storage.' })}</div>}
    </div>
  );
}
