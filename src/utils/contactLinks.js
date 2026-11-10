// Normalize phone numbers and encode the message for emergency deep links.
export function contactHrefs(phone, message = '') {
  const digits = phone.replace(/[^0-9]/g, '');
  if (!digits) return { call: '#', sms: '#', wa: '#' };
  const help = encodeURIComponent(message);
  return {
    call: `tel:+${digits}`,
    sms: `sms:+${digits}?body=${help}`,
    wa: `https://wa.me/${digits}?text=${help}`,
  };
}
