# 🏪 Hanoutik Admin Panel# React + Vite



> Panneau d'administration moderne et puissant pour la plateforme HanoutikThis template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.



![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)Currently, two official plugins are available:

![React](https://img.shields.io/badge/React-18.x-61DAFB.svg)

![Tailwind](https://img.shields.io/badge/Tailwind-3.x-38B2AC.svg)- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh

- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

---

## Expanding the ESLint configuration

## 📋 Table des Matières

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.

- [À Propos](#-à-propos)
- [Fonctionnalités](#-fonctionnalités)
- [Technologies](#-technologies)
- [Installation](#-installation)
- [Documentation](#-documentation)

---

## 🎯 À Propos

**Hanoutik Admin Panel** est une interface d'administration complète pour gérer la plateforme Hanoutik - un système qui connecte les fournisseurs aux petits commerces (Hanouts) en Tunisie.

### Système de Business

- **Fournisseurs** partagent leurs produits sur la plateforme
- **Clients (Hanouts)** passent des commandes via l'app mobile
- **Partenaires** amènent des fournisseurs et gagnent des commissions (% du 1 DT prélevé par commande)
- **Admin** gère l'ensemble de l'écosystème

---

## ✨ Fonctionnalités

### 🏠 Dashboard
- Vue d'ensemble des statistiques en temps réel
- KPIs principaux (utilisateurs, commandes, produits, partenaires)
- Commandes du jour et du mois
- Calcul automatique des commissions
- Actions rapides vers les sections principales

### 👥 Gestion des Utilisateurs
- Liste complète Hanouts et Fournisseurs
- Vérification des utilisateurs (toggle)
- Autorisation de subvention (toggle)
- Statistiques de commandes par utilisateur
- Distinction commandes commissionnables/fusionnées
- Filtres et recherche avancée

### 🤝 Gestion des Partenaires
- Création de nouveaux partenaires
- Vue détaillée des statistiques par partenaire
- Commission calculée automatiquement
- Détail par fournisseur (commandes, taux, revenue)
- Top performers
- Filtrage par mois
- Explication du système de commission

### 📦 Gestion des Produits
- Validation des produits en attente
- Ajout manuel de produits
- Support produits au poids
- Filtrage par catégorie
- Recherche par code-barres

### ⭐ Gestion des Avis
- Affichage de tous les feedbacks
- Note moyenne calculée
- Distribution des notes (graphique)
- Filtrage par nombre d'étoiles

---

## 🛠️ Technologies

### Frontend
- **React** 18.x
- **React Router** 6.x
- **Tailwind CSS** 3.x
- **React Icons** (FontAwesome 6)
- **Recharts** - Graphiques
- **Vite** - Build tool

### Backend (API)
- **Spring Boot**
- **MongoDB**
- **JWT** Authentication

---

## 🚀 Installation

### Prérequis
```bash
Node.js >= 16.x
npm >= 8.x
```

### Étapes

1. **Cloner le repository**
```bash
git clone https://github.com/YASSINEDERBE/Admin-Panel.git
cd admin-panel
```

2. **Installer les dépendances**
```bash
npm install
```

3. **Configurer les variables d'environnement**
Créer un fichier `.env` à la racine :
```env
VITE_API_URL=http://localhost:8080/api
```

4. **Lancer le serveur de développement**
```bash
npm run dev
```

5. **Ouvrir dans le navigateur**
```
http://localhost:5173
```

### Build pour Production

```bash
npm run build
```

---

## 📚 Documentation

### Documents Disponibles

- **[SYSTEME_COMMISSION.md](./SYSTEME_COMMISSION.md)** - Système de commission détaillé
- **[AMELIORATIONS_DESIGN.md](./AMELIORATIONS_DESIGN.md)** - Guide de design et améliorations

### Structure du Projet

```
admin-panel/
├── src/
│   ├── components/      # Composants réutilisables
│   │   ├── Layout.jsx
│   │   ├── SideBar.jsx
│   │   ├── Spinner.jsx
│   │   └── PaginationControls.jsx
│   ├── pages/           # Pages de l'application
│   │   ├── Home.jsx              # Dashboard principal
│   │   ├── Login.jsx             # Authentification
│   │   ├── Users.jsx             # Gestion utilisateurs
│   │   ├── Partners.jsx          # Gestion partenaires
│   │   ├── Products.jsx          # Tous les produits
│   │   ├── PendingProducts.jsx   # Produits en attente
│   │   ├── EditProductPending.jsx
│   │   └── FeedbackScreen.jsx    # Avis clients
│   ├── main.jsx         # Point d'entrée + Router
│   └── index.css        # Styles globaux
├── .env                 # Variables d'environnement
└── package.json         # Dépendances
```

---

## 🎨 Design System

### Couleurs Principales

```css
--blue-primary: #1E3A8A
--blue-secondary: #3B82F6
--gold: #D4AF37
--success: #10B981
--error: #EF4444
```

### Composants UI

- Cards avec dégradés et ombres
- Boutons avec animations
- Tables responsive
- Modals avec backdrop blur
- Graphiques interactifs

---

## 💰 Système de Commission

### Règles de Base

1. **Hanoutik prend 1 DT** par commande commissionnab le
2. **Partenaire gagne un %** de ce 1 DT
3. **Commandes commissionnables**:
   - Statut: `COMPLETED` ou `DELIVERED`
   - `mergedTo == null` (non fusionnée)

### Exemple

```
Fournisseur A (Partenaire X avec taux 30%):
- 100 commandes commissionnables

Revenue:
- Hanoutik: 100 × 1 DT = 100 DT
- Partenaire X: 100 × 1 DT × 0.30 = 30 DT
- Net Hanoutik: 70 DT
```

---

## 📊 Statistiques

- **Pages**: 8 pages principales
- **Composants**: 4 composants réutilisables
- **Endpoints API**: 15+
- **Technologies**: React, Tailwind, Vite

---

## 🔒 Sécurité

- ✅ JWT Authentication
- ✅ Protected routes
- ✅ Input validation
- ✅ XSS protection

---

## 🙏 Crédits

Développé avec ❤️ par l'équipe Hanoutik

*Dernière mise à jour: 8 Novembre 2025*
