// ATP and WTA use IOC nationality codes; UI flags use ISO region codes.
export const tennisCountries = { ITA: 'IT', GER: 'DE', ESP: 'ES', USA: 'US', CAN: 'CA', FRA: 'FR', AUS: 'AU', SRB: 'RS', CZE: 'CZ', MON: 'MC', KAZ: 'KZ', NOR: 'NO', ARG: 'AR', BEL: 'BE', BRA: 'BR', CHI: 'CL', PER: 'PE', GBR: 'GB', POL: 'PL', NED: 'NL', GRE: 'GR', POR: 'PT', PAR: 'PY', HUN: 'HU', CRO: 'HR', SVK: 'SK', HKG: 'HK', BIH: 'BA', CHN: 'CN', FIN: 'FI', JPN: 'JP', COL: 'CO', AUT: 'AT', GEO: 'GE', RSA: 'ZA', BUL: 'BG', BOL: 'BO', LTU: 'LT', SUI: 'CH', EST: 'EE', LUX: 'LU', UKR: 'UA', RUS: 'RU', BLR: 'BY', ROU: 'RO', TUN: 'TN', EGY: 'EG', DEN: 'DK', SWE: 'SE', SLO: 'SI', LAT: 'LV', MEX: 'MX', ISR: 'IL', TPE: 'TW', KOR: 'KR', IND: 'IN', THA: 'TH', PHI: 'PH', UZB: 'UZ', INA: 'ID', ECU: 'EC' };

export function tennisCountryCode(country) {
  return tennisCountries[country] || country || '';
}
