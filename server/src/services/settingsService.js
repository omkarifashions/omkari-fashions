import SiteSettings from '../models/SiteSettings.js';

export async function getSettings() {
  let s = await SiteSettings.findOne({ key: 'main' });
  if (!s) s = await SiteSettings.create({ key: 'main' });
  return s;
}
