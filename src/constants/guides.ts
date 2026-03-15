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
    id: 'caf-aides-familiales',
    title: 'Aides familiales CAF',
    subtitle: 'Allocations et prestations pour familles avec enfants',
    category: 'family',
    emoji: '👨‍👩‍👧',
    difficulty: 'medium',
    estimatedTime: '2–4 semaines',
    relevantFor: ['new_arrival', 'resident', 'worker', 'family'],
    lastUpdated: '2026-01',
    officialSource: 'https://www.caf.fr',
    steps: [
      {
        id: 'step-1',
        title: 'Vérifier votre éligibilité',
        description:
          'Pour bénéficier des aides familiales en France, vous devez avoir un titre de séjour valide '
          + 'd\'au moins 3 mois, vos enfants doivent résider en France, et vous devez déclarer vos revenus à la CAF.',
        tip: 'Même avec un titre de séjour récent, vous pouvez déjà faire la demande. N\'attendez pas !',
      },
      {
        id: 'step-2',
        title: 'Créer votre espace CAF',
        description:
          'Rendez-vous sur caf.fr et créez votre espace allocataire. Vous aurez besoin de votre numéro '
          + 'de sécurité sociale. Si vous n\'en avez pas encore, inscrivez-vous d\'abord à la CPAM.',
        documents: [
          'Titre de séjour valide (au moins 3 mois)',
          'Numéro de sécurité sociale (CPAM)',
          'RIB (relevé d\'identité bancaire)',
          'Acte de naissance des enfants (traduction assermentée si né à l\'étranger)',
          'Justificatif de domicile de moins de 3 mois',
        ],
        officialLink: 'https://www.caf.fr',
      },
      {
        id: 'step-3',
        title: 'Allocations familiales (2 enfants et plus)',
        description:
          'Si vous avez 2 enfants ou plus de moins de 20 ans à charge, vous avez droit aux allocations familiales. '
          + 'Le montant varie selon vos revenus : de 140€ à 178€/mois pour 2 enfants.',
        tip: 'Les allocations familiales ne sont pas accordées pour le 1er enfant seul. Pour un enfant unique, d\'autres aides existent : la PAJE et le complément de libre choix du mode de garde.',
      },
      {
        id: 'step-4',
        title: 'PAJE — aide pour les enfants de moins de 3 ans',
        description:
          'La Prestation d\'Accueil du Jeune Enfant (PAJE) comprend : une prime à la naissance (≈ 985€) '
          + 'et une allocation de base mensuelle jusqu\'aux 3 ans de l\'enfant (≈ 185€/mois).',
        documents: [
          'Déclaration de grossesse (avant le 3ᵉ mois) ou acte de naissance',
          'Justificatif de revenus de l\'année précédente (avis d\'imposition)',
        ],
        tip: 'Déclarez votre grossesse avant la fin du 3ᵉ mois pour toucher la prime à la naissance. Passé ce délai, la prime est perdue !',
        officialLink: 'https://www.caf.fr/allocataires/aides-et-demarches/droits-et-prestations/petite-enfance/la-paje-prestation-d-accueil-du-jeune-enfant',
      },
      {
        id: 'step-5',
        title: 'Complément familial (3 enfants et plus)',
        description:
          'Si vous avez 3 enfants ou plus, tous âgés de 3 à 21 ans, vous pouvez recevoir le complément familial '
          + '(≈ 180€/mois) sous conditions de ressources.',
        tip: 'Le simulateur CAF en ligne calcule gratuitement toutes vos aides potentielles en moins de 5 minutes. C\'est la première étape conseillée avant toute démarche.',
        officialLink: 'https://wwwd.caf.fr/wps/portal/caffr/aidesetservices/lesservicesenligne/estimervosdroits',
      },
    ],
  },
  // ── EDUCATION ────────────────────────────────────────────────────────────────
  {
    id: 'ecole-inscription',
    title: 'Inscrire son enfant à l\'école',
    subtitle: 'Maternelle et primaire — démarche en mairie',
    category: 'education',
    emoji: '🏫',
    difficulty: 'easy',
    estimatedTime: '2–4 semaines',
    relevantFor: ['new_arrival', 'resident', 'family'],
    lastUpdated: '2026-01',
    officialSource: 'https://www.service-public.fr/particuliers/vosdroits/F1264',
    steps: [
      {
        id: 'step-1',
        title: 'Trouver l\'école de secteur',
        description: 'Chaque adresse est rattachée à une école de secteur. Rendez-vous sur le site de la mairie ou de la commune pour connaître l\'école correspondant à votre adresse.',
        officialLink: 'https://www.service-public.fr/particuliers/vosdroits/F1264',
        tip: 'Vous pouvez aussi appeler directement la mairie pour connaître l\'école de votre secteur.',
      },
      {
        id: 'step-2',
        title: 'Rassembler les documents',
        description: 'Préparez les documents nécessaires avant de vous rendre en mairie.',
        documents: [
          'Justificatif de domicile de moins de 3 mois',
          'Livret de famille ou acte de naissance de l\'enfant',
          'Carnet de santé (vaccinations à jour)',
          'Jugement de garde (si applicable)',
        ],
      },
      {
        id: 'step-3',
        title: 'S\'inscrire à la mairie',
        description: 'Rendez-vous au service scolaire de la mairie avec tous vos documents. L\'inscription est obligatoire pour les enfants de 3 à 16 ans.',
        tip: 'Appelez avant pour connaître les horaires du service scolaire.',
      },
      {
        id: 'step-4',
        title: 'Obtenir le certificat d\'inscription',
        description: 'La mairie vous remet un certificat d\'inscription indiquant l\'école affectée à votre enfant. Conservez ce document précieusement.',
      },
      {
        id: 'step-5',
        title: 'Rencontrer le directeur d\'école',
        description: 'Contactez l\'école pour un rendez-vous avec le directeur. Il validera l\'admission définitive et vous informera sur les fournitures, horaires et cantine.',
        tip: 'Demandez si l\'école dispose d\'un CASNAV — soutien linguistique pour les enfants non-francophones.',
      },
    ],
  },
  {
    id: 'campus-france',
    title: 'Étudier en France — Campus France',
    subtitle: 'Candidature pour étudiants étrangers',
    category: 'education',
    emoji: '🎓',
    difficulty: 'hard',
    estimatedTime: '3–6 mois',
    relevantFor: ['student', 'new_arrival'],
    lastUpdated: '2026-01',
    officialSource: 'https://www.campusfrance.org',
    steps: [
      {
        id: 'step-1',
        title: 'Créer un dossier Campus France',
        description: 'Rendez-vous sur campusfrance.org et créez votre espace. Remplissez votre profil académique et choisissez jusqu\'à 12 établissements.',
        officialLink: 'https://www.campusfrance.org',
        tip: 'Commencez 6 mois à l\'avance. Les dossiers ouvrent généralement en novembre pour une rentrée en septembre.',
      },
      {
        id: 'step-2',
        title: 'Rassembler les documents académiques',
        description: 'Préparez vos diplômes et relevés de notes traduits en français par un traducteur assermenté.',
        documents: [
          'Diplômes (traduits et certifiés)',
          'Relevés de notes des 3 dernières années',
          'Lettre de motivation (en français)',
          'CV académique (en français)',
          'Passeport valide',
          'Photos d\'identité',
        ],
      },
      {
        id: 'step-3',
        title: 'Passer l\'entretien Campus France',
        description: 'Dans votre pays d\'origine, prenez rendez-vous à l\'Espace Campus France (ambassade ou Institut Français) pour un entretien de motivation.',
        tip: 'Préparez une présentation claire de votre projet d\'études et de vos motivations pour la France.',
      },
      {
        id: 'step-4',
        title: 'Demander le visa étudiant',
        description: 'Après acceptation, déposez votre demande de visa long séjour étudiant (VLS-TS) auprès du consulat français de votre pays.',
        documents: [
          'Lettre d\'admission de l\'université',
          'Attestation de ressources suffisantes (≈ 615€/mois)',
          'Justificatif de logement en France',
        ],
        tip: 'Faites la demande de visa dès que vous avez votre lettre d\'admission — les délais peuvent être longs.',
      },
      {
        id: 'step-5',
        title: 'S\'inscrire à l\'université',
        description: 'À votre arrivée, confirmez votre inscription administrative, payez les frais de scolarité et obtenez votre carte étudiante.',
        tip: 'Validez votre VLS-TS en ligne sur le portail ANEF dans les 3 mois suivant votre arrivée en France.',
      },
    ],
  },
  {
    id: 'bourse-crous',
    title: 'Demander une bourse CROUS',
    subtitle: 'Aide financière pour étudiants',
    category: 'education',
    emoji: '📚',
    difficulty: 'medium',
    estimatedTime: '2–3 mois',
    relevantFor: ['student'],
    lastUpdated: '2026-01',
    officialSource: 'https://www.etudiant.gouv.fr',
    steps: [
      {
        id: 'step-1',
        title: 'Vérifier l\'éligibilité',
        description: 'Les bourses CROUS sont principalement pour les ressortissants UE et assimilés. Les étudiants étrangers hors UE peuvent bénéficier d\'aides spécifiques selon leur situation.',
        tip: 'Consultez le CROUS de votre académie pour connaître les aides accessibles selon votre situation.',
      },
      {
        id: 'step-2',
        title: 'Faire la DSE (Dossier Social Étudiant)',
        description: 'Sur messervices.etudiant.gouv.fr, remplissez votre Dossier Social Étudiant entre le 15 janvier et le 15 mai pour une rentrée en septembre.',
        officialLink: 'https://www.messervices.etudiant.gouv.fr',
        documents: [
          'Avis d\'imposition des parents (ou tuteur légal)',
          'Relevé d\'identité bancaire (RIB)',
          'Justificatif de scolarité ou préinscription',
        ],
      },
      {
        id: 'step-3',
        title: 'Attendre la notification de bourse',
        description: 'Le CROUS analyse votre dossier et vous notifie de votre échelon (0 à 7 selon les revenus). Les montants vont de 100€ à 600€/mois.',
        tip: 'Conservez votre attestation de bourse — elle donne droit à des réductions sur les transports, la culture et plus.',
      },
      {
        id: 'step-4',
        title: 'Percevoir la bourse',
        description: 'La bourse est versée chaque mois sur votre compte bancaire. Pensez à renouveler votre dossier chaque année avant le 15 mai.',
        tip: 'Même en cas de refus, déposez le dossier : un échelon 0 bis peut exonérer des frais d\'inscription universitaires.',
      },
    ],
  },

  // ── REFUGEE ──────────────────────────────────────────────────────────────────
  {
    id: 'ofpra-asile',
    title: 'Demander l\'asile en France',
    subtitle: 'Procédure OFPRA — protection internationale',
    category: 'documents',
    emoji: '🛡️',
    difficulty: 'hard',
    estimatedTime: '12–24 mois',
    relevantFor: ['refugee'],
    lastUpdated: '2026-01',
    officialSource: 'https://www.ofpra.gouv.fr',
    steps: [
      {
        id: 'step-1',
        title: 'Se présenter au guichet unique (GUDA)',
        description: 'Dans les 3 jours suivant votre arrivée, rendez-vous dans le Guichet Unique pour Demandeurs d\'Asile (GUDA) de votre département pour enregistrer votre demande.',
        officialLink: 'https://www.france-asile.fr',
        tip: 'Appelez le 115 (hébergement d\'urgence) ou le 3949 (info asile) pour vous orienter dès votre arrivée.',
      },
      {
        id: 'step-2',
        title: 'Obtenir l\'attestation de demandeur d\'asile',
        description: 'Après enregistrement, vous recevez une attestation de demandeur d\'asile. Elle autorise votre séjour en France pendant l\'examen de votre dossier.',
        documents: [
          'Passeport ou pièce d\'identité (si disponible)',
          'Tout document prouvant votre identité ou parcours',
          'Photos d\'identité',
        ],
        tip: 'Même sans documents d\'identité, vous avez le droit de déposer une demande d\'asile.',
      },
      {
        id: 'step-3',
        title: 'Remplir le formulaire OFPRA',
        description: 'Vous avez 21 jours pour envoyer à l\'OFPRA votre formulaire avec un récit détaillé expliquant pourquoi vous ne pouvez pas retourner dans votre pays.',
        officialLink: 'https://www.ofpra.gouv.fr',
        tip: 'Rédigez un récit précis, chronologique et personnel. Une association peut vous aider gratuitement.',
      },
      {
        id: 'step-4',
        title: 'Passer l\'entretien OFPRA',
        description: 'Un officier de protection vous convoque pour un entretien individuel. Vous pouvez être accompagné d\'un interprète et d\'un avocat.',
        tip: 'Préparez votre entretien avec une association spécialisée (FTDA, Forum Réfugiés, La Cimade...).',
      },
      {
        id: 'step-5',
        title: 'Recevoir la décision',
        description: 'L\'OFPRA vous notifie par courrier. Si reconnu réfugié, vous obtenez un titre de séjour de 10 ans. En cas de rejet, vous pouvez faire appel auprès de la CNDA dans un délai d\'1 mois.',
        tip: 'En cas de rejet, ne perdez pas le délai d\'1 mois pour saisir la CNDA — faites-vous accompagner par un avocat.',
      },
    ],
  },
  {
    id: 'cada-hebergement',
    title: 'Logement en CADA',
    subtitle: 'Centre d\'Accueil pour Demandeurs d\'Asile',
    category: 'housing',
    emoji: '🏠',
    difficulty: 'medium',
    estimatedTime: '1–4 semaines',
    relevantFor: ['refugee'],
    lastUpdated: '2026-01',
    officialSource: 'https://www.france-asile.fr',
    steps: [
      {
        id: 'step-1',
        title: 'Demander une place en CADA',
        description: 'Lors de votre enregistrement au GUDA, une place en CADA peut vous être proposée via le Dispositif National d\'Accueil (DNA). Acceptez si possible — le logement y est gratuit.',
        tip: 'Si on ne vous propose pas de CADA, demandez explicitement une orientation vers le DNA.',
      },
      {
        id: 'step-2',
        title: 'Contacter le 115 (SIAO)',
        description: 'Si vous n\'avez pas d\'hébergement immédiat, appelez le 115 gratuitement. Ce numéro d\'urgence vous oriente vers les hébergements disponibles.',
        tip: 'Appelez le 115 en soirée — les places d\'hébergement sont souvent attribuées au jour le jour.',
      },
      {
        id: 'step-3',
        title: 'Comprendre les règles du CADA',
        description: 'En CADA, vous bénéficiez d\'un logement, de repas et d\'un accompagnement social. En contrepartie, vous devez respecter le règlement et participer activement à votre demande d\'asile.',
        tip: 'Profitez de l\'accompagnement social du CADA — les travailleurs sociaux peuvent aider dans toutes vos démarches.',
      },
      {
        id: 'step-4',
        title: 'Quitter le CADA après décision',
        description: 'Si votre demande est acceptée, vous disposez d\'un délai (1 mois renouvelable) pour trouver un logement autonome. Des associations accompagnent cette transition.',
        tip: 'Commencez à chercher un logement dès que vous connaissez la décision — les délais sont courts.',
      },
    ],
  },
  {
    id: 'ada-allocation',
    title: 'ADA — Allocation Demandeur d\'Asile',
    subtitle: 'Aide financière pendant la procédure d\'asile',
    category: 'finance',
    emoji: '💶',
    difficulty: 'easy',
    estimatedTime: '2–4 semaines',
    relevantFor: ['refugee'],
    lastUpdated: '2026-01',
    officialSource: 'https://www.ofii.fr',
    steps: [
      {
        id: 'step-1',
        title: 'Vérifier l\'éligibilité',
        description: 'L\'ADA est versée aux demandeurs d\'asile qui ont accepté les conditions matérielles d\'accueil et dont la demande est en cours d\'examen par l\'OFPRA.',
        tip: 'Si vous êtes logé en CADA, une partie de l\'ADA couvre les frais d\'hébergement.',
      },
      {
        id: 'step-2',
        title: 'Recevoir la carte prépayée OFII',
        description: 'L\'ADA est versée sur une carte de paiement prépayée fournie par l\'OFII. Vous n\'avez pas besoin d\'un compte bancaire pour la recevoir.',
        tip: 'La carte ADA fonctionne comme une carte bancaire — paiement en magasin et retrait d\'espèces possible.',
      },
      {
        id: 'step-3',
        title: 'Connaître les montants',
        description: 'Le montant mensuel varie selon votre situation : sans logement ≈ 426€/mois pour 1 personne, en CADA ≈ 204€/mois. Des majorations existent pour les familles.',
        documents: [
          'Attestation de demandeur d\'asile',
          'Attestation de conditions matérielles d\'accueil',
        ],
        tip: 'Des majorations sont prévues pour les familles avec enfants et les personnes vulnérables.',
      },
      {
        id: 'step-4',
        title: 'Signaler tout changement',
        description: 'Si votre situation change (logement, composition familiale), signalez-le à l\'OFII. L\'ADA s\'arrête dès que l\'OFPRA rend sa décision définitive.',
        tip: 'Conservez tous les courriers OFII et OFPRA — ils sont indispensables pour l\'ensemble de vos démarches.',
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
