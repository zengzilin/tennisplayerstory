// @ts-nocheck
import React from 'react';
import { useTranslation } from 'react-i18next';
import { tennisCountryCode } from '../../../../shared/tennis-countries.mjs';

const getFlagEmoji = (countryCode) => {
  if (!countryCode) return '🏳️';
  const code = tennisCountryCode(countryCode).toUpperCase();
  if (code.length !== 2) return '🏳️';
  const offset = 127397;
  return String.fromCodePoint(code.charCodeAt(0) + offset, code.charCodeAt(1) + offset);
};

const CountryFlag = ({ country, showName = true, className = "" }) => {
  const { i18n } = useTranslation();
  const code = tennisCountryCode(country);
  const name = /^[A-Z]{2}$/.test(code) ? new Intl.DisplayNames([i18n.language], { type: 'region' }).of(code) : country;
  if (!country) return <span className="text-muted-foreground">-</span>;
  
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <span className="text-xl" aria-hidden="true" title={country}>{getFlagEmoji(country)}</span>
      {showName && <span className="font-medium text-sm">{name}</span>}
    </div>
  );
};

export default CountryFlag;