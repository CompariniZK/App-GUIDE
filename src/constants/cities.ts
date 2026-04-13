// ─── City Configuration ──────────────────────────────────────────────────────
// Cada cidade-cliente tem os seus dados locais aqui.
// Para adicionar uma nova cidade, basta adicionar um objeto ao array CITIES.

export interface LocalResource {
  name: string;
  type:
    | 'ccas'
    | 'association'
    | 'prefecture'
    | 'spada'
    | 'university'
    | 'cpam'
    | 'caf'
    | 'france_travail'
    | 'ofii'
    | 'other';
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
      // ── Préfecture ──────────────────────────────────────────────────────
      {
        name: 'Préfecture de la Vendée',
        type: 'prefecture',
        phone: '02 51 36 70 85',
        address: '29 rue Delille, 85922 La Roche-sur-Yon Cedex 9',
        hours: 'Point numérique : Lun-Ven 9h30-11h30 | 14h-16h',
        website: 'https://www.vendee.gouv.fr',
        description: 'Titres de séjour, naturalisation, échange de permis',
      },
      // ── CPAM ────────────────────────────────────────────────────────────
      {
        name: 'CPAM de la Vendée',
        type: 'cpam',
        phone: '36 46',
        address: '61 rue Alain, 85931 La Roche-sur-Yon',
        hours: 'Lun-Ven 8h30-17h00 (sur rendez-vous)',
        website: 'https://www.ameli.fr',
        description: 'Sécurité sociale, carte Vitale, remboursements',
      },
      // ── CAF ─────────────────────────────────────────────────────────────
      {
        name: 'CAF de la Vendée',
        type: 'caf',
        phone: '32 30',
        address: '109 boulevard Louis-Blanc, 85932 La Roche-sur-Yon',
        hours: 'Lun-Ven 9h-16h',
        website: 'https://www.caf.fr',
        description: 'APL, allocations familiales, RSA, prime d\'activité',
      },
      // ── France Travail ──────────────────────────────────────────────────
      {
        name: 'France Travail — La Roche-Sud',
        type: 'france_travail',
        phone: '39 49',
        address: '33 rue du Commerce, 85000 La Roche-sur-Yon',
        hours: 'Lun-Ven 8h30-12h30 | Sur RDV après-midi',
        website: 'https://www.francetravail.fr',
        description: 'Inscription chômage, offres d\'emploi, formations',
      },
      // ── CCAS ────────────────────────────────────────────────────────────
      {
        name: 'CCAS de La Roche-sur-Yon',
        type: 'ccas',
        phone: '02 51 47 48 57',
        address: '10 rue Delille, 85000 La Roche-sur-Yon',
        hours: 'Lun-Mer 8h30-17h30 | Jeu 8h30-12h30 | Ven 8h30-17h00',
        website: 'https://larochesuryon.fr/ccas/',
        description: 'Aide sociale, droit au compte bancaire, accompagnement',
      },
      // ── OFII ────────────────────────────────────────────────────────────
      {
        name: 'OFII — Antenne La Roche-sur-Yon',
        type: 'ofii',
        phone: '02 51 09 67 50',
        address: '2 boulevard Aristide Briand, 85000 La Roche-sur-Yon',
        hours: 'Lun-Ven 9h-12h',
        website: 'https://www.ofii.fr',
        description: 'Contrat d\'intégration (CIR), cours de français, ADA',
      },
      // ── SPADA ───────────────────────────────────────────────────────────
      {
        name: 'France Terre d\'Asile (SPADA)',
        type: 'spada',
        phone: '02 51 37 48 00',
        address: 'La Roche-sur-Yon',
        description: 'Plateforme d\'accueil pour demandeurs d\'asile',
      },
      // ── Association ─────────────────────────────────────────────────────
      {
        name: 'Cimade-Vendée',
        type: 'association',
        address: 'La Roche-sur-Yon',
        website: 'https://larochesuryon.fr/annuaires/cimade-vendee/',
        description: 'Aide juridique, accès aux droits des migrants',
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

// Ícones par type de ressource
export const RESOURCE_ICONS: Record<LocalResource['type'], string> = {
  prefecture:     '🏢',
  cpam:           '🏥',
  caf:            '👨‍👩‍👧',
  france_travail: '💼',
  ccas:           '🏛️',
  ofii:           '🇫🇷',
  spada:          '🛟',
  association:    '🤝',
  university:     '🎓',
  other:          '📍',
};

// Mapeamento: ID do guia → tipos de recursos locais pertinentes
export const GUIDE_RESOURCE_MAP: Record<string, LocalResource['type'][]> = {
  'titre-sejour-renouvellement': ['prefecture'],
  'caf-apl':                     ['caf'],
  'cpam-inscription':            ['cpam'],
  'banque-sans-fiador':          ['ccas'],
  'permis-echange':              ['prefecture'],
  'caf-aides-familiales':        ['caf'],
  'ecole-inscription':           ['ccas'],
  'campus-france':               ['ccas'],
  'bourse-crous':                ['caf'],
  'ofpra-asile':                 ['spada', 'ofii'],
  'cada-hebergement':            ['spada', 'ofii'],
  'ada-allocation':              ['ofii'],
  'france-travail-inscription':  ['france_travail'],
};
