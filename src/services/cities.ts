/**
 * Cities client — talks to the Boussole backend, which proxies the official
 * French open-data APIs (API Géo + Annuaire de l'Administration).
 */
import { API_BASE_URL } from '../constants/api';
import { getAuthHeader } from './authHeader';

export interface CommuneResult {
  insee: string;
  name: string;
  department: string;
  postalCode: string;
  population: number;
}

export type ResourceType =
  | 'prefecture' | 'mairie' | 'ccas' | 'caf' | 'cpam'
  | 'france_travail' | 'france_services' | 'ofii' | 'other';

export interface LocalResource {
  name: string;
  type: ResourceType;
  address?: string;
  postalCode?: string;
  phone?: string;
  website?: string;
  email?: string;
}

const SEARCH_URL = `${API_BASE_URL}/api/cities/search`;

/** Search any French commune by name. Returns [] on error (non-fatal UX). */
export async function searchCommunes(query: string): Promise<CommuneResult[]> {
  const q = query.trim();
  if (q.length < 2) return [];
  try {
    const authHeader = await getAuthHeader();
    const res = await fetch(`${SEARCH_URL}?q=${encodeURIComponent(q)}`, {
      headers: { Accept: 'application/json', ...authHeader },
    });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data?.communes) ? data.communes : [];
  } catch {
    return [];
  }
}

/** Official local public services for a commune (by INSEE code). */
export async function getCityResources(insee: string): Promise<LocalResource[]> {
  const code = (insee || '').trim();
  if (!/^[0-9A-B]{5}$/i.test(code)) return [];
  try {
    const authHeader = await getAuthHeader();
    const res = await fetch(`${API_BASE_URL}/api/cities/${encodeURIComponent(code)}/resources`, {
      headers: { Accept: 'application/json', ...authHeader },
    });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data?.resources) ? data.resources : [];
  } catch {
    return [];
  }
}
