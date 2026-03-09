# Boussole 🧭
**Votre guide en France — App mobile pour immigrants**

## Démarrage rapide

```bash
# 1. Installer les dépendances
npm install

# 2. Lancer l'app (scan QR avec Expo Go sur votre téléphone)
npm start

# 3. Ou lancer directement sur Android
npm run android
```

## Structure du projet

```
boussole/
├── App.tsx                        # Point d'entrée
├── src/
│   ├── context/
│   │   └── ProfileContext.tsx     # État global de l'utilisateur (AsyncStorage)
│   ├── navigation/
│   │   ├── AppNavigator.tsx       # Routeur principal (Onboarding vs Main)
│   │   ├── OnboardingNavigator.tsx
│   │   └── MainTabNavigator.tsx   # 4 onglets: Home, Guides, Chat, Profil
│   ├── screens/
│   │   ├── onboarding/
│   │   │   ├── WelcomeScreen.tsx  # Écran d'accueil
│   │   │   ├── NationalityScreen.tsx
│   │   │   └── SituationScreen.tsx
│   │   ├── home/
│   │   │   └── HomeScreen.tsx     # Dashboard personnalisé
│   │   ├── guides/
│   │   │   ├── GuidesScreen.tsx   # Liste + filtre par catégorie
│   │   │   └── GuideDetailScreen.tsx  # Étapes détaillées
│   │   ├── chat/
│   │   │   └── ChatScreen.tsx     # Interface de chat avec l'IA
│   │   └── profile/
│   │       └── ProfileScreen.tsx  # Profil + stats + paramètres
│   ├── constants/
│   │   ├── colors.ts              # Palette de couleurs
│   │   └── guides.ts              # Données des guides (titre séjour, CAF, CPAM...)
│   └── types/
│       └── index.ts               # Types TypeScript
```

## Prochaines étapes — Backend IA

Voir `src/screens/chat/ChatScreen.tsx` — la fonction `callBoussoleAI()` est prête.
Il suffit de remplacer la simulation par un appel à votre API:

```typescript
const response = await fetch('http://VOTRE_IP:3000/api/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ message: userMessage, history }),
});
const data = await response.json();
return data.reply;
```

Le backend Node.js utilisera:
- **LangChain.js** pour le pipeline RAG
- **pgvector** pour la recherche sémantique
- **Claude API (Anthropic)** pour les réponses
- Documents sources: service-public.fr, legifrance.gouv.fr, OFII

## Guides inclus dans le MVP

| Guide | Catégorie | Difficulté |
|-------|-----------|------------|
| Renouveler le titre de séjour | Documents | Complexe |
| Demander l'APL (CAF) | Logement | Intermédiaire |
| S'inscrire à la CPAM | Santé | Intermédiaire |
| Ouvrir un compte bancaire | Finance | Facile |
| Échanger son permis de conduire | Mobilité | Intermédiaire |
| S'inscrire à France Travail | Emploi | Intermédiaire |

---
Développé avec ❤️ — Boussole 2026
