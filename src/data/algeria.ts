import { algeriaData as wilayas } from './wilayas';
import { dhdCommunes as communes } from './communes';

export const algeriaData = wilayas.map(w => ({
  ...w,
  communes: communes
    .filter(c => c.wilaya_id === parseInt(w.id))
    .map(c => c.nom)
    .sort()
}));
