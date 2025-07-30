import { countryData } from "../countryData";
import axios from "axios";

export function codeToFlagEmoji(code: string): string {
  if (!code || code.length !== 2) return "🏳️";
  return String.fromCodePoint(
    ...[...code.toUpperCase()].map((c) => 0x1f1e6 - 65 + c.charCodeAt(0))
  );
}

export function getCountryCodeByName(name: string): string | undefined {
  let found = countryData.find(
    (c) => c.name.toLowerCase() === name.toLowerCase()
  );
  if (found) return found.code;
  const normalized = name.replace(/[^a-zA-Z]/g, "").toLowerCase();
  found = countryData.find(
    (c) => c.name.replace(/[^a-zA-Z]/g, "").toLowerCase() === normalized
  );
  if (found) return found.code;
  return undefined;
}

export function capitalizeWords(str: string): string {
  return str.replace(/\b\w/g, (c) => c.toUpperCase());
}

export async function getCodes() {
  try {
    const response = await axios.get(
      "http://34.130.136.222:3000/protocol/sync/stats"
    );

    const data = response.data?.miner_country_name_to_code;

    if (!data) {
      console.warn("No miner_country_name_to_code found in response.");
      return [];
    }

    console.log(data);
    return data;
  } catch (error: any) {
    console.error("Failed to fetch codes:", error.message || error);
    return [];
  }
}
