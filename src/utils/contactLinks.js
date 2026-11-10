// Deep-link generation for emergency contacts, mirroring profile.html's
// updateContactLinks(): non-digits stripped, tel:/sms:/wa.me links with the
// prototype's emergency message text.
export const EMERGENCY_HELP_TEXT =
  '🚨 緊急狀況：我現在有腦癇發作或需要醫療協助，請盡快與我聯絡！';

export function contactHrefs(phone) {
  if (phone === '') return { call: '#', sms: '#', wa: '#' };
  const digits = phone.replace(/\D/g, '');
  const help = encodeURIComponent(EMERGENCY_HELP_TEXT);
  return {
    call: `tel:+${digits}`,
    sms: `sms:+${digits}?body=${help}`,
    wa: `https://wa.me/${digits}?text=${help}`,
  };
}
