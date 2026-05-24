// @ts-nocheck
import React from 'react';

const getFlagEmoji = (countryCode) => {
  if (!countryCode) return '🏳️';
  const code = countryCode.toUpperCase();
  if (code.length !== 2) return '🏳️';
  const offset = 127397;
  return String.fromCodePoint(code.charCodeAt(0) + offset, code.charCodeAt(1) + offset);
};

const CountryFlag = ({ country, showName = true, className = "" }) => {
  if (!country) return <span className="text-muted-foreground">-</span>;
  
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <span className="text-xl" aria-hidden="true" title={country}>{getFlagEmoji(country)}</span>
      {showName && <span className="font-medium text-sm">{country}</span>}
    </div>
  );
};

export default CountryFlag;