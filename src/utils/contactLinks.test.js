import { expect, test } from 'vitest';
import { contactHrefs } from './contactLinks';

test('omitted message produces empty contact message parameters', () => {
  expect(contactHrefs('+852 1234 5678')).toEqual({ call: 'tel:+85212345678', sms: 'sms:+85212345678?body=', wa: 'https://wa.me/85212345678?text=' });
});
