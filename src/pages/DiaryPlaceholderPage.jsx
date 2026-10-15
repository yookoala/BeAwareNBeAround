import { t } from '@lingui/core/macro';

// "Coming soon" stand-in for the Diary mode (PLAN06 decision 4): the diary
// features are ported from efhk-diary-react in later milestones.
export default function DiaryPlaceholderPage() {
  return (
    <>
      <section className="header">
        <h1 className="theme-title">{t({ id: 'diary.title', message: 'Diary coming soon' })}</h1>
      </section>
      <p className="diary-placeholder">{t({ id: 'diary.body', message: 'The diary feature is under development. Stay tuned.' })}</p>
    </>
  );
}
