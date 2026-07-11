# Boussole — Guia de publicação na Google Play Store

Tudo pronto pra copiar e colar na **Play Console**. Siga na ordem.

---

## 1. Criar o app na Play Console

1. https://play.google.com/console → **Create app**
2. Preencha:
   - **App name**: `Boussole`
   - **Default language**: `Français (France) – fr-FR`
   - **App or game**: `App`
   - **Free or paid**: `Free`
3. Aceite as declarações → **Create app**

---

## 2. Store listing (Présence sur le Store → Fiche principale)

### Nom de l'application (30 caractères max)
```
Boussole
```

### Description courte (80 caractères max)
```
Vos démarches administratives en France, simplifiées. Guides + assistant IA.
```

### Description complète (4000 caractères max)
```
Boussole est l'application gratuite qui accompagne les immigrants dans leurs démarches administratives en France.

Naviguer la bureaucratie française peut être compliqué : titre de séjour, carte Vitale, CAF, logement, école, travail… Boussole vous guide à chaque étape, dans votre langue.

━━━━━━━━━━━━━━━━━━━━
✦ CE QUE BOUSSOLE VOUS OFFRE
━━━━━━━━━━━━━━━━━━━━

📋 DES GUIDES OFFICIELS PAS-À-PAS
Plus de 13 guides couvrant toutes les étapes de votre installation :
• Renouveler son titre de séjour
• S'inscrire à la CPAM (carte Vitale)
• Demander l'APL (aide au logement)
• S'inscrire à France Travail
• Ouvrir un compte bancaire
• Inscrire un enfant à l'école
• Demande d'asile (OFPRA)
• Et bien plus…

Chaque guide contient les étapes détaillées, les documents nécessaires, les liens officiels et les délais estimés.

🤖 UN ASSISTANT IA JURIDIQUE
Posez vos questions et obtenez des réponses claires, basées sur le droit français (CESEDA, Code civil, Code du travail…). L'assistant répond dans votre langue et s'adapte à votre situation.

🌍 DISPONIBLE EN 5 LANGUES
Français, Anglais, Portugais, Espagnol et Arabe. L'application détecte automatiquement votre langue selon votre nationalité.

🗺️ DES RESSOURCES LOCALES
Adresses, horaires et contacts des services de votre ville : préfecture, CCAS, associations d'aide.

🔒 VOS DONNÉES PROTÉGÉES
Vos données sont hébergées en Europe (conformité RGPD), chiffrées, et ne sont jamais vendues. Vous gardez le contrôle total : suppression de votre compte possible à tout moment.

━━━━━━━━━━━━━━━━━━━━
✦ POUR QUI ?
━━━━━━━━━━━━━━━━━━━━

Boussole s'adresse à tous les immigrants en France, quelle que soit leur situation : étudiants, travailleurs, demandeurs d'asile, réfugiés, regroupement familial, nouveaux arrivants…

━━━━━━━━━━━━━━━━━━━━

Simple. Gratuit. Disponible 24h/24.

Boussole n'est pas un service gouvernemental officiel. Les informations fournies sont à caractère informatif et ne remplacent pas un conseil juridique professionnel. Vérifiez toujours les informations sur les sites officiels avant vos démarches.
```

### Catégorie
- **Application type**: `Applications`
- **Category**: `Outils` (ou `Éducation`)
- **Tags**: immigration, administration, guide

### Coordonnées
- **E-mail**: `contact@boussole.app` (ou o e-mail que você usa)
- **Site web**: `https://boussole.it.com`
- **Politique de confidentialité**: `https://boussole.it.com/politique-confidentialite.html`

---

## 3. Assets gráficos (Fiche principale → Éléments graphiques)

| Asset | Tamanho | Onde pegar |
|-------|---------|------------|
| **Icône de l'app** | 512×512 PNG | `assets/playstore-icon.png` ✅ pronto |
| **Image de présentation** (feature graphic) | 1024×500 PNG | ⏳ preciso gerar |
| **Captures d'écran téléphone** | mín. 2, máx. 8 (16:9 ou 9:16) | ⏳ tirar do app |

### Screenshots — como tirar
No app (BlueStacks ou Android), capture estas telas:
1. Tela inicial (Home) com guias
2. Lista de guias (Guides)
3. Um guia aberto (detalhe)
4. Chat IA com uma resposta
5. Tela de perfil / multilíngue

Formato: **1080×1920** (retrato). Mínimo 2, recomendo 4-5.

---

## 4. Data Safety form (Sécurité des données) ⚠️ CRÍTICO

Este formulário DEVE bater com a realidade, senão o Google rejeita. Respostas exatas:

### Est-ce que votre app collecte ou partage des données ?
**Oui** (collecte)

### Données collectées :

| Type de donnée | Collectée ? | Partagée ? | Finalité |
|----------------|-------------|-----------|----------|
| **Adresse e-mail** | Oui | Non | Gestion du compte, authentification |
| **Nom** (si fourni) | Non | — | — |
| **Nationalité / pays** | Oui | Non | Personnalisation de l'app |
| **Messages** (chat IA) | Oui | Oui* | Fonctionnalité de l'app |
| **ID utilisateur** | Oui | Non | Gestion du compte |

*Les messages du chat sont transmis aux fournisseurs d'IA (Groq, Anthropic) pour générer les réponses. Déclarer comme "partagé" avec des prestataires.

### Pratiques de sécurité :
- ✅ **Les données sont chiffrées en transit** (Oui)
- ✅ **L'utilisateur peut demander la suppression des données** (Oui — via l'app ou par e-mail)
- ✅ **Engagement envers la politique Play Families** : non destiné aux enfants

### Types de données — détail para marcar:
- **Informations personnelles** → Adresse e-mail ✅, ID utilisateur ✅
- **Messages** → Autres messages intégrés à l'app ✅
- **NÃO marcar**: localisation, contacts, photos, fichiers, données financières, santé, historique de navigation, SMS, calendrier

---

## 5. Content rating (Classification du contenu)

Preencha o questionário. Respostas para Boussole:
- **Violence**: Non
- **Contenu sexuel**: Non
- **Langage grossier**: Non
- **Substances contrôlées**: Non
- **Interactions sociales** (chat): l'IA n'est pas une interaction entre utilisateurs → Non
- Resultado esperado: **PEGI 3 / Tout public**

---

## 6. Public cible (Audience et contenu)

- **Tranche d'âge cible**: `18 ans et plus` (contenu administratif adulte)
- **Votre app cible-t-elle les enfants ?**: **Non**

---

## 7. App content — declarações obrigatórias

- **Publicités**: `Non, mon app ne contient pas de publicités`
- **Accès à l'app**: `Toutes les fonctionnalités sont disponibles sans restriction spéciale` (ou fornecer login de teste — ver abaixo)
- **Données financières / gouvernementales**: déclarer que c'est informatif, non affilié au gouvernement

### ⚠️ Login de teste para revisão do Google
Como o app exige cadastro, o Google precisa de uma conta de teste:
- Crie uma conta de teste no app: `test@boussole.it.com` / senha forte
- Confirme o e-mail dela no Supabase
- Forneça no campo **"Identifiants pour l'accès"** da Play Console

---

## 8. Testes obrigatórios (Closed testing — 12 testeurs, 14 jours)

⚠️ Regra Google para contas pessoais (desde nov/2023):
1. **Closed testing** com **12 testadores** que optam por participar
2. Manter por **14 dias consecutivos**
3. Só depois libera para **Production**

### Como organizar:
1. Play Console → **Test → Closed testing** → criar uma track
2. Adicionar e-mails dos 12 testadores (Gmail deles)
3. Compartilhar o link de opt-in com eles
4. Eles instalam e usam por 14 dias
5. Depois → **Promote to Production**

💡 Testadores podem ser: família, amigos, colegas, membros de associações de imigrantes. A sua tia já é uma! Precisa de mais 11.

---

## 9. Checklist final antes de submeter

- [ ] `.aab` de produção enviado (App bundles)
- [ ] Store listing preenchido (descrições, categoria)
- [ ] Ícone 512×512 + feature graphic 1024×500
- [ ] Mín. 2 screenshots
- [ ] Data Safety form completo e honesto
- [ ] Content rating obtido
- [ ] Public cible definido
- [ ] Política de privacidade linkada
- [ ] Login de teste fornecido
- [ ] 12 testadores no closed testing

---

## URLs importantes (guardar)

| Item | URL |
|------|-----|
| Play Console | https://play.google.com/console |
| Politique de confidentialité | https://boussole.it.com/politique-confidentialite.html |
| Mentions légales | https://boussole.it.com/mentions-legales.html |
| Page confirmation e-mail | https://boussole.it.com/auth-confirme.html |
| Backend (Railway) | https://app-guide-production.up.railway.app |
| Build produção EAS | https://expo.dev/accounts/comparini_04/projects/boussole/builds |
