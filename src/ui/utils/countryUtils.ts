import { countryData } from '../countryData';

export function codeToFlagEmoji(code: string): string {
  if (!code || code.length !== 2) return '🏳️';
  return String.fromCodePoint(...[...code.toUpperCase()].map(c => 0x1f1e6 - 65 + c.charCodeAt(0)));
}

export function getCountryCodeByName(name: string): string | undefined {
  let found = countryData.find(c => c.name.toLowerCase() === name.toLowerCase());
  if (found) return found.code;
  const normalized = name.replace(/[^a-zA-Z]/g, '').toLowerCase();
  found = countryData.find(c => c.name.replace(/[^a-zA-Z]/g, '').toLowerCase() === normalized);
  if (found) return found.code;
  return undefined;
}

export function capitalizeWords(str: string): string {
  return str.replace(/\b\w/g, c => c.toUpperCase());
} 