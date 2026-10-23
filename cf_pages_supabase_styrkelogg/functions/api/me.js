import { json } from '../_lib.js';

export function onRequestGet({ data }) {
  return json({ email: data.userEmail });
}
