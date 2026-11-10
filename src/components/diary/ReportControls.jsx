import { t } from '@lingui/core/macro';
import { useNavigate } from 'react-router-dom';

export default function ReportControls({ bw, onToggle }) {
  const navigate = useNavigate();
  return (
    <div className="controls">
      <button type="button" onClick={() => navigate('/diary')}>{t({ id: 'report.back', message: '← Back to Diary' })}</button>
      <span id="modeStatus" role="status">{bw ? t({ id: 'report.modeBW', message: 'Current mode: B&W / Grayscale' }) : t({ id: 'report.modeColor', message: 'Current mode: Color' })}</span>
      <button type="button" onClick={onToggle} aria-pressed={bw}>{t({ id: 'report.toggle', message: 'Toggle B&W / Color Mode' })}</button>
    </div>
  );
}
