// ─── City Configuration ──────────────────────────────────────────────────────
// Cada cidade-cliente tem os seus dados locais aqui.
// Para adicionar uma nova cidade, basta adicionar um objeto ao array CITIES.

export interface LocalResource {
  name: string;
  type: 'ccas' | 'association' | 'prefecture' | 'spada' | 'university' | 'other';
  phone?: string;
  address?: string;
  hours?: string;
  website?: string;
  description?: string;
}

export interface CityConfig {
  id: string;
  name: string;
  department: string;
  population: number;
  foreignResidents: number;     // estrangeiros residentes
  prefectureUrl: string;
  resources: LocalResource[];
}

// ─── Cities ──────────────────────────────────────────────────────────────────

export const CITIES: CityConfig[] = [
  {
    id: 'la-roche-sur-yon',
    name: 'La Roche-sur-Yon',
    department: 'Vendée (85)',
    population: 55000,
    foreignResidents: 3954,
    prefectureUrl: 'https://www.vendee.gouv.fr',
    resources: [
      {
        name: 'CCAS de La Roche-sur-Yon',
        type: 'ccas',
        phone: '02 51 47 48 57',
        address: '10, rue Delille, 85000 La Roche-sur-Yon',
        hours: 'Lun-Mer 8h30-17h30 | Jeu 8h30-12h30 | Ven 8h30-17h00',
        website: 'https://larochesuryon.fr/ccas/',
        description: 'Aide sociale, aides financières, accompagnement',
      },
      {
        name: 'France Terre d\'Asile (SPADA)',
        type: 'spada',
        phone: '02 51 37 48 00',
        address: 'La Roche-sur-Yon',
        description: 'Plateforme d\'accueil pour demandeurs d\'asile — 301 personnes accueillies en 2023',
      },
      {
        name: 'Cimade-Vendée',
        type: 'association',
        address: 'La Roche-sur-Yon',
        website: 'https://larochesuryon.fr/annuaires/cimade-vendee/',
        description: 'Aide juridique, accès aux droits des migrants',
      },
      {
        name: 'Préfecture de la Vendée',
        type: 'prefecture',
        phone: '02 51 36 70 85',
        address: '29 rue Delille, 85922 La Roche-sur-Yon Cedex 9',
        website: 'https://www.vendee.gouv.fr',
        description: 'Titres de séjour, naturalisation',
      },
    ],
  },
  // ─── Ajouter d'autres villes ici ─────────────────────────────────────────
  // {
  //   id: 'nantes',
  //   name: 'Nantes',
  //   department: 'Loire-Atlantique (44)',
  //   ...
  // },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

export function getCityById(id: string): CityConfig | undefined {
  return CITIES.find(c => c.id === id);
}

export function getCityNames(): { id: string; name: string }[] {
  return CITIES.map(c => ({ id: c.id, name: `${c.name} (${c.department})` }));
}

// Icones par type de resource
export const RESOURCE_ICONS: Record<LocalResource['type'], string> = {
  ccas: '🏛',
  association: '🤝',
  prefecture: '🏢',
  spada: '🛟',
  university: '🎓',
  other: '📍',
};
