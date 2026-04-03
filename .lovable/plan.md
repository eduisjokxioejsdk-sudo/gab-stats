

# Plan : Mode Banc + affichage du code de partage

## Résumé
Deux changements :
1. **Bouton 📡 dans LiveScoring** : au lieu de copier un lien, affiche simplement le code à 6 caractères dans un petit modal/popup pour que le statisticien puisse le dicter au coach.
2. **Bouton "Mode Banc" sur l'accueil** : ouvre un champ de saisie pour entrer le code à 6 caractères, puis redirige vers `/coach?code=XXXXXX`.

## Modifications

### 1. `src/components/HomeScreen.tsx`
- Ajouter un state `showBenchMode` + `benchCode` (string de 6 chars).
- Ajouter un bouton **"📺 Mode Banc"** dans la section accueil (après "Gérer les équipes").
- Au clic → affiche un petit dialog/modal avec un input de 6 caractères + bouton "Rejoindre".
- À la validation → `window.location.href = '/coach?code=' + benchCode`.

### 2. `src/components/LiveScoring.tsx`
- Remplacer le `handleShareLink` (qui copie dans le presse-papier) par un state `showShareCode` qui affiche un petit modal avec le code en gros caractères (ex: `A B C D E F`).
- Le bouton 📡 toggle ce modal. Le coach peut lire le code visuellement.

### Détails techniques
- Pas de nouvelles dépendances.
- Le `CoachView` et `useLiveSync` restent inchangés.
- Le code à 6 caractères est déjà généré par `useLiveSync` — on l'affiche simplement à l'écran au lieu de construire un lien.

