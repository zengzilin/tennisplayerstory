import PDFParser from 'pdf2json';
import { tennisCountryCode } from '../../../../shared/tennis-countries.mjs';

export const ATP_RANKINGS_URL = 'https://www.protennislive.com/posting/ramr/singles_entry_numerical.pdf';

/** Parse the numerical singles report linked by ATP's official media page. */
export async function parseAtpRankings(buffer, now = Date.now()) {
  if (buffer.length > 10 * 1024 * 1024 || buffer.subarray(0, 5).toString() !== '%PDF-') throw new Error('ATP response is not a PDF');
  const document = await new Promise((resolve, reject) => {
    const parser = new PDFParser();
    parser.once('pdfParser_dataError', error => reject(new Error('Invalid ATP PDF', { cause: error.parserError })));
    parser.once('pdfParser_dataReady', resolve);
    parser.parseBuffer(buffer);
  });
  const pages = document.Pages.map(page => page.Texts.map(text => text.R.map(run => decodeURIComponent(run.T)).join('')));
  const header = pages[0];
  if (!header?.includes('Rankings/ Numerical Order/ Complete/ Singles')) throw new Error('Unexpected ATP report');
  const dateText = header[header.indexOf('Rankings Date:') + 3];
  const date = Date.parse(`${dateText} UTC`);
  if (!Number.isFinite(date) || now - date > 14 * 86400000 || date > now + 86400000) throw new Error('ATP ranking date is missing or stale');
  const rankingDate = new Date(date).toISOString().slice(0, 10);
  const players = [];
  for (const texts of pages) {
    for (let index = 0; index < texts.length; index++) {
      // Each row starts with bold rank, a space, then "Surname, Given name".
      const name = texts[index];
      if (!name.includes(', ') || !/^\d+T?$/.test(texts[index - 2] || '') || texts[index - 1] !== ' ') continue;
      const ranking = Number(texts[index - 2].replace('T', ''));
      if (ranking > 150) continue;
      let column = index + 1;
      const nationality = /^\(([A-Z]{3})\)$/.exec(texts[column]);
      if (nationality) column++;
      const values = texts.slice(column, column + 7);
      if (values.length !== 7 || values.some(value => !/^\d+$/.test(value))) throw new Error(`Invalid ATP row ${ranking}`);
      const [surname, givenName] = name.split(', ');
      players.push({ name: `${givenName} ${surname}`, ranking, points: Number(values[0]), tournaments: Number(values[4]),
        country: nationality ? tennisCountryCode(nationality[1]) : '',
        previous_ranking: null, source: 'atp', source_url: ATP_RANKINGS_URL, ranking_date: rankingDate });
    }
  }
  if (players.length < 150) throw new Error('Incomplete ATP top 150');
  return players.slice(0, 150);
}
