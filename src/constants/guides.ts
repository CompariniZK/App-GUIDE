import { Guide } from '../types';

export const GUIDES: Guide[] = [
  {
    id: 'titre-sejour-renouvellement',
    title: 'Renouveler son titre de séjour',
    subtitle: 'Démarche sur le portail ANEF — étape par étape',
    category: 'documents',
    emoji: '📄',
    difficulty: 'hard',
    estimatedTime: '2–3 mois',
    relevantFor: ['resident', 'worker', 'student', 'family'],
    lastUpdated: '2026-01',
    officialSource: 'https://administration-etrangers-en-france.interieur.gouv.fr',
    steps: [
      {
        id: 'step-1',
        title: 'Vérifier la date d\'expiration',
        description:
          'Commencez la démarche au moins 2 mois avant l\'expiration de votre titre de séjour. '
          + 'Au-delà de 3 mois d\'avance, le dossier sera refusé.',
        tip: 'Activez une alarme sur votre téléphone 2 mois et 2 semaines avant la date d\'expiration.',
      },
      {
        id: 'step-2',
        title: 'Créer un compte sur l\'ANEF',
        description:
          'Rendez-vous sur administration-etrangers-en-france.interieur.gouv.fr et créez votre espace personnel. '
          + 'Vous aurez besoin d\'une adresse e-mail valide.',
        officialLink: 'https://administration-etrangers-en-france.interieur.gouv.fr',
      },
      {
        id: 'step-3',
        title: 'Rassembler les documents',
        description:
          'Préparez tous les documents en format numérique (PDF ou JPEG). '
          + 'Chaque fichier ne doit pas dépasser 5 Mo.',
        documents: [
          'Titre de séjour actuel (recto-verso)',
          'Passeport valide (toutes les pages)',
          'Justificatif de domicile de moins de 3 mois',
          'Photos d\'identité récentes (normes françaises)',
          'Justificatifs selon votre situation (contrat de travail, attestation employeur, etc.)',
          'Timbre fiscal (achat en ligne sur timbres.impots.gouv.fr)',
        ],
        officialLink: 'https://timbres.impots.gouv.fr',
      },
      {
        id: 'step-4',
        title: 'Remplir le formulaire en ligne',
        description:
          'Sur l\'ANEF, choisissez "Renouveler mon titre de séjour" et suivez le formulaire. '
          + 'La démarche prend environ 45 minutes. Vous pouvez sauvegarder et reprendre plus tard.',
        tip: 'Faites la démarche sur ordinateur, pas sur mobile — le formulaire est difficile à utiliser sur petit écran.',
      },
      {
        id: 'step-5',
        title: 'Soumettre et récupérer le récépissé',
        description:
          'Après soumission, vous recevrez un récépissé par e-mail sous 24–72h. '
          + 'Ce document a la même valeur que votre titre pendant l\'instruction du dossier. '
          + 'Conservez-le précieusement.',
        tip: 'Le récépissé vous permet de continuer à travailler et à voyager dans l\'espace Schengen.',
      },
    ],
  },
  {
    id: 'caf-apl',
    title: 'Demander l\'APL (Aide au Logement)',
    subtitle: 'Réduire son loyer avec l\'aide de la CAF',
    category: 'housing',
    emoji: '🏠',
    difficulty: 'medium',
    estimatedTime: '2–4 semaines',
    relevantFor: ['new_arrival', 'resident', 'student', 'worker'],
    lastUpdated: '2026-01',
    officialSource: 'https://www.caf.fr',
    steps: [
      {
        id: 'step-1',
        title: 'Vérifier votre éligibilité',
        description:
          'L\'APL est accessible aux locataires dont le logement est conventionné. '
          + 'Vérifiez sur le simulateur CAF.fr avant de faire la demande.',
        officialLink: 'https://wwwd.caf.fr/wps/portal/caffr/aidesetservices/lesservicesenligne/estimervosdroits/lesinformationsdufoyer',
        tip: 'Le logement doit être votre résidence principale en France.',
      },
      {
        id: 'step-2',
        title: 'Créer votre compte CAF',
        description:
          'Rendez-vous sur caf.fr et créez votre espace personnel. '
          + 'Vous devez avoir un numéro de sécurité sociale (CPAM). '
          + 'Si vous n\'en avez pas encore, faites d\'abord la demande CPAM.',
        officialLink: 'https://www.caf.fr',
      },
      {
        id: 'step-3',
        title: 'Faire la demande en ligne',
        description:
          'Dans votre espace CAF, cliquez sur "Faire une demande de prestation" > "Aide au logement". '
          + 'Renseignez vos informations de logement et de ressources.',
        documents: [
          'Contrat de bail (bail de location)',
          'Dernier avis d\'imposition ou déclaration de revenus',
          'RIB de votre compte bancaire',
          'Justificatif de résidence régulière (titre de séjour)',
        ],
      },
      {
        id: 'step-4',
        title: 'Attendre la validation',
        description:
          'Le délai de traitement est de 2 à 4 semaines. '
          + 'Vous recevrez une notification par e-mail. '
          + 'L\'APL est versée directement à votre propriétaire ou à vous-même.',
        tip: 'L\'APL est versée à partir du mois suivant la date de votre emménagement si vous faites la demande dans les 12 mois.',
      },
    ],
  },
  {
    id: 'cpam-inscription',
    title: 'S\'inscrire à la Sécurité Sociale (CPAM)',
    subtitle: 'Obtenir votre numéro de sécu et la carte Vitale',
    category: 'health',
    emoji: '🏥',
    difficulty: 'medium',
    estimatedTime: '1–3 mois',
    relevantFor: ['new_arrival', 'resident', 'worker', 'student'],
    lastUpdated: '2026-01',
    officialSource: 'https://www.ameli.fr',
    steps: [
      {
        id: 'step-1',
        title: 'Créer un compte Ameli',
        description:
          'Rendez-vous sur ameli.fr et cliquez sur "Pas encore de compte Ameli ?". '
          + 'Vous aurez besoin de votre numéro de sécurité sociale si vous en avez un, '
          + 'ou de votre date de naissance et nom.',
        officialLink: 'https://assure.ameli.fr/PortailAS/appmanager/PortailAS/assure?_nfpb=true&_pageLabel=as_creercompte_label',
      },
      {
        id: 'step-2',
        title: 'Choisir votre caisse CPAM',
        description:
          'Votre CPAM dépend de votre lieu de résidence. '
          + 'Si vous venez d\'arriver, faites la demande d\'affiliation auprès de la CPAM de votre département.',
        documents: [
          'Titre de séjour valide',
          'Passeport ou pièce d\'identité',
          'Justificatif de domicile',
          'Acte de naissance avec traduction assermentée (si né à l\'étranger)',
          'Contrat de travail ou attestation d\'études',
          'RIB pour le remboursement des soins',
        ],
      },
      {
        id: 'step-3',
        title: 'Envoyer le dossier',
        description:
          'Envoyez votre dossier par courrier ou déposez-le en agence CPAM. '
          + 'Vous recevrez un numéro de sécurité sociale provisoire pendant l\'instruction.',
      },
      {
        id: 'step-4',
        title: 'Désigner un médecin traitant',
        description:
          'Une fois affilié, désignez un médecin traitant (généraliste) via ameli.fr. '
          + 'C\'est obligatoire pour être remboursé à 70% des consultations.',
        tip: 'Trouvez un médecin traitant qui accepte de nouveaux patients sur doctolib.fr ou via le moteur de recherche Ameli.',
        officialLink: 'https://www.ameli.fr/assure/remboursements/etre-bien-rembourse/medecin-traitant',
      },
      {
        id: 'step-5',
        title: 'Recevoir la carte Vitale',
        description:
          'Votre carte Vitale sera envoyée par courrier dans les semaines suivant votre affiliation. '
          + 'Elle contient tous vos droits à l\'assurance maladie.',
        tip: 'En attendant votre carte Vitale, utilisez l\'attestation de droits disponible sur ameli.fr — elle a la même valeur.',
      },
    ],
  },
  {
    id: 'banque-sans-fiador',
    title: 'Ouvrir un compte bancaire',
    subtitle: 'Les meilleures options pour les immigrants en France',
    category: 'finance',
    emoji: '🏦',
    difficulty: 'easy',
    estimatedTime: '1–5 jours',
    relevantFor: ['new_arrival', 'resident', 'student', 'worker'],
    lastUpdated: '2026-01',
    steps: [
      {
        id: 'step-1',
        title: 'Choisir le bon type de banque',
        description:
          'Les banques mobiles (Revolut, Wise, N26, Nickel) sont les plus accessibles pour les immigrants. '
          + 'Elles n\'exigent généralement pas de justificatif de domicile en France ni de fiador.',
        tip: 'Commencez par une banque mobile pour recevoir votre salaire, puis ouvrez un compte traditionnel quand vous aurez plus de documents.',
      },
      {
        id: 'step-2',
        title: 'Option 1 — Banques mobiles (recommandé)',
        description:
          'Revolut, Wise ou N26 s\'ouvrent en 10 minutes depuis votre smartphone. '
          + 'Vous n\'avez besoin que de votre passeport et d\'une photo selfie.',
        documents: [
          'Passeport valide',
          'Photo selfie avec le passeport',
          'E-mail valide',
        ],
        tip: 'Wise est idéal si vous recevez de l\'argent depuis l\'étranger — les frais de change sont très bas.',
      },
      {
        id: 'step-3',
        title: 'Option 2 — Compte Nickel (en bureau de tabac)',
        description:
          'Nickel est disponible dans les buralistes (bureaux de tabac) avec seulement un document d\'identité. '
          + 'C\'est la solution la plus rapide pour un compte français avec un IBAN français.',
        documents: [
          'Pièce d\'identité valide (passeport, titre de séjour)',
          '20€ pour le kit de démarrage',
        ],
        officialLink: 'https://compte.nickel.eu',
      },
      {
        id: 'step-4',
        title: 'Option 3 — Banque traditionnelle',
        description:
          'BNP Paribas, Société Générale, Crédit Agricole... exigent plus de documents '
          + 'mais offrent plus de services (prêts, épargne, etc.).',
        documents: [
          'Titre de séjour valide',
          'Justificatif de domicile en France',
          'Justificatif de revenus ou contrat de travail',
          'Dernier relevé bancaire étranger (optionnel)',
        ],
        tip: 'Si vous n\'avez pas de logement fixe, le service "Droit au compte" de la Banque de France vous garantit l\'ouverture d\'un compte — c\'est un droit légal.',
        officialLink: 'https://www.banque-france.fr/fr/particuliers/proteger-vos-interets/droit-au-compte',
      },
    ],
  },
  {
    id: 'permis-echange',
    title: 'Échanger son permis de conduire étranger',
    subtitle: 'Convertir votre permis en permis français',
    category: 'transport',
    emoji: '🚗',
    difficulty: 'medium',
    estimatedTime: '3–6 mois',
    relevantFor: ['new_arrival', 'resident', 'worker'],
    lastUpdated: '2026-01',
    officialSource: 'https://permisdeconduire.ants.gouv.fr',
    steps: [
      {
        id: 'step-1',
        title: 'Vérifier si votre permis est échangeable',
        description:
          'Certains pays ont des accords d\'échange avec la France (Brésil, Maroc, Algérie, Tunisie, etc.). '
          + 'Si votre pays est sur la liste, l\'échange se fait sans examen. Sinon, vous devrez repasser les épreuves.',
        officialLink: 'https://www.service-public.fr/particuliers/vosdroits/F1758',
        tip: 'Le Brésil a un accord d\'échange avec la France — vous n\'avez pas à repasser le permis.',
      },
      {
        id: 'step-2',
        title: 'Faire la demande en ligne sur l\'ANTS',
        description:
          'Rendez-vous sur permisdeconduire.ants.gouv.fr et créez votre dossier. '
          + 'La démarche se fait entièrement en ligne.',
        officialLink: 'https://permisdeconduire.ants.gouv.fr',
        documents: [
          'Permis de conduire original + traduction assermentée',
          'Titre de séjour valide',
          'Justificatif de domicile',
          'Photo d\'identité numérique',
          'Timbre fiscal (25€)',
        ],
      },
      {
        id: 'step-3',
        title: 'Envoyer les documents originaux',
        description:
          'Après la demande en ligne, vous devrez envoyer votre permis original par courrier recommandé. '
          + 'Un récépissé vous sera remis — il vous permet de conduire pendant l\'instruction.',
      },
      {
        id: 'step-4',
        title: 'Recevoir le permis français',
        description:
          'Délai moyen : 3 à 6 mois. Votre permis étranger sera retourné avec le permis français. '
          + 'Le permis français est valable 15 ans.',
      },
    ],
  },
  {
    id: 'france-travail-inscription',
    title: 'S\'inscrire à France Travail',
    subtitle: 'Accéder aux allocations chômage (ARE) et aux formations',
    category: 'work',
    emoji: '💼',
    difficulty: 'medium',
    estimatedTime: '1–2 semaines',
    relevantFor: ['resident', 'worker'],
    lastUpdated: '2026-01',
    officialSource: 'https://www.francetravail.fr',
    steps: [
      {
        id: 'step-1',
        title: 'Vérifier votre éligibilité à l\'ARE',
        description:
          'Pour toucher le chômage (ARE), vous devez avoir travaillé au minimum 6 mois '
          + 'sur les 24 derniers mois et avoir perdu involontairement votre emploi (licenciement, fin de CDD).',
        tip: 'Une démission ne donne généralement pas droit à l\'ARE, sauf démission légitime.',
      },
      {
        id: 'step-2',
        title: 'S\'inscrire en ligne',
        description:
          'Allez sur francetravail.fr et cliquez sur "Je m\'inscris". '
          + 'L\'inscription doit se faire dans les 12 mois suivant la fin de votre contrat.',
        officialLink: 'https://candidat.francetravail.fr/inscription/',
        documents: [
          'Titre de séjour avec droit au travail',
          'Attestation employeur Pôle Emploi (remise par votre employeur)',
          'Dernier contrat de travail',
          'RIB',
          'CV à jour',
        ],
      },
      {
        id: 'step-3',
        title: 'Entretien de situation professionnelle',
        description:
          'Après inscription, vous aurez un premier rendez-vous avec un conseiller. '
          + 'Il établira votre profil et votre plan personnalisé d\'accès à l\'emploi (PPAE).',
      },
      {
        id: 'step-4',
        title: 'Actualisation mensuelle',
        description:
          'Chaque mois, vous devez vous "actualiser" sur francetravail.fr pour continuer à recevoir vos allocations. '
          + 'Indiquez si vous avez travaillé dans le mois.',
        tip: 'Activez les rappels — oublier l\'actualisation peut bloquer le versement de vos allocations.',
      },
    ],
  },
];

export const GUIDE_CATEGORIES = [
  { id: 'documents', label: 'Documents', emoji: '📄' },
  { id: 'health',    label: 'Santé',     emoji: '🏥' },
  { id: 'housing',   label: 'Logement',  emoji: '🏠' },
  { id: 'work',      label: 'Emploi',    emoji: '💼' },
  { id: 'family',    label: 'Famille',   emoji: '👨‍👩‍👧' },
  { id: 'finance',   label: 'Banque',    emoji: '🏦' },
  { id: 'transport', label: 'Mobilité',  emoji: '🚗' },
  { id: 'education', label: 'Éducation', emoji: '🎓' },
];
