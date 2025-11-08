# 💰 Système de Commission Hanoutik

## Vue d'ensemble

Hanoutik est une plateforme qui permet aux **fournisseurs** de partager leurs produits avec des **clients** (Hanouts) via une application mobile. Le système génère des revenus via des frais de service et un programme de partenariat.

---

## 🎯 Acteurs du Système

### 1. **Hanoutik (La Plateforme)**
- Propriétaire et opérateur de l'application
- Prend **1 DT par commande** comme frais de service

### 2. **Fournisseurs (Suppliers)**
- Entreprises qui partagent leurs produits sur la plateforme
- Reçoivent des commandes des clients Hanouts
- Peuvent être rattachés à un partenaire

### 3. **Clients (Hanouts)**
- Utilisateurs finaux de l'application mobile
- Passent des commandes auprès des fournisseurs

### 4. **Partenaires (Partners)**
- Apportent des fournisseurs à la plateforme
- Gagnent une commission sur les commandes de leurs fournisseurs

---

## 💵 Système de Revenus

### Frais de Service Hanoutik
**1 DT par commande** prélevé sur les commandes qui remplissent ces critères:
- ✅ Statut: `COMPLETED` ou `DELIVERED`
- ✅ `mergedTo == null` (commande non fusionnée)

### Commission des Partenaires
Les partenaires gagnent un **pourcentage du 1 DT** prélevé par Hanoutik.

**Formule:**
```
Commission Partenaire = 1 DT × Taux de Commission
```

**Exemple:**
- Taux de commission du partenaire: 30%
- Commandes commissionnables: 100
- Hanoutik gagne: 100 × 1 DT = **100 DT**
- Partenaire gagne: 100 × 1 DT × 0.30 = **30 DT**
- Net Hanoutik: 100 - 30 = **70 DT**

---

## 📊 Types de Commandes

### 🟢 Commandes Commissionnables
Génèrent des revenus pour Hanoutik ET le partenaire:
- Statut: `COMPLETED` ou `DELIVERED`
- `mergedTo == null`
- Revenu: **1 DT** (partagé avec partenaire si applicable)

### 🔴 Commandes Fusionnées
Ne génèrent **AUCUN revenu**:
- `mergedTo != null`
- Ces commandes ont été fusionnées avec une autre commande
- Pas de frais de service
- Pas de commission partenaire

### ⚪ Autres Commandes
Ne génèrent pas de revenus:
- Statut: `PENDING`, `CANCELLED`, etc.
- Pas encore complétées ou annulées

---

## 🔧 Configuration Technique

### Modèle de Données

#### Order (Commande)
```java
{
  id: String
  status: OrderStatus  // PENDING, COMPLETED, DELIVERED, CANCELLED
  mergedTo: Integer    // null ou ID de commande fusionnée
  supplier: DBRef<Supplier>
  user: DBRef<User>
  amount: Float
  // ...
}
```

#### Partner (Partenaire)
```java
{
  id: String
  companyName: String
  suppliers: List<SupplierForPartner>
  // ...
}
```

#### SupplierForPartner (Relation Partenaire-Fournisseur)
```java
{
  supplier: DBRef<Supplier>
  commission: Double      // Ex: 0.30 pour 30%
  status: String         // ACTIVE, INACTIVE
  ordersCount: Long
  commissionableOrders: Long
  mergedOrders: Long
  // ...
}
```

---

## 📈 Calculs dans l'Admin Panel

### Pour chaque Fournisseur
```javascript
// Total des commandes
totalOrders = orders.filter(order => order.supplier.id === supplierId).length

// Commandes commissionnables
commissionableOrders = orders.filter(order => 
  order.supplier.id === supplierId &&
  (order.status === 'COMPLETED' || order.status === 'DELIVERED') &&
  (order.mergedTo == null)
).length

// Commandes fusionnées
mergedOrders = orders.filter(order => 
  order.supplier.id === supplierId &&
  order.mergedTo != null
).length

// Revenue Hanoutik
hanoutikRevenue = commissionableOrders × 1.0 DT

// Commission Partenaire
partnerCommission = commissionableOrders × 1.0 × commission_rate
```

---

## 🎨 Interface Admin Panel

### Page Users
- Liste tous les utilisateurs (Hanouts et Fournisseurs)
- Affiche pour chaque fournisseur:
  - Total des commandes
  - 💰 Commandes commissionnables
  - 🔗 Commandes fusionnées
  - Boutons pour vérifier les utilisateurs
  - Boutons pour autoriser les subventions

### Page Partners
- Liste tous les partenaires
- Affiche les statistiques globales:
  - Total des commissions versées
  - Nombre de commandes commissionnables
  - Nombre de fournisseurs actifs
  
- Pour chaque partenaire, affiche:
  - Commission totale gagnée
  - Nombre de commandes de ses fournisseurs
  - Liste détaillée par fournisseur avec:
    - Total commandes
    - Commandes commissionnables
    - Commandes fusionnées
    - Taux de commission
    - Montant gagné

---

## 🔐 Règles Business

1. **Seules les commandes COMPLETED/DELIVERED génèrent des revenus**
2. **Les commandes fusionnées (mergedTo != null) sont exclues du calcul**
3. **Le taux de commission est défini par fournisseur lors de l'association avec le partenaire**
4. **La commission du partenaire est un pourcentage du 1 DT prélevé par Hanoutik**
5. **Un fournisseur peut avoir un seul partenaire**
6. **Un partenaire peut avoir plusieurs fournisseurs avec des taux différents**

---

## 📱 Endpoints API Principaux

### Partners
- `GET /partners/` - Liste des partenaires
- `GET /partners/orders/{partnerId}/statistics?month={YYYY-MM}` - Stats du partenaire
- `GET /partners/get-suppliers/{partnerId}?month={YYYY-MM}` - Fournisseurs du partenaire
- `POST /auth/partner/register` - Créer un partenaire

### Users/Suppliers
- `GET /users/` - Liste des utilisateurs
- `GET /suppliers/` - Liste des fournisseurs
- `PUT /users/update-user/{userId}` - Mettre à jour un utilisateur
- `PUT /suppliers/update-supplier/{supplierId}` - Mettre à jour un fournisseur

### Orders
- `GET /orders/find/` - Liste des commandes

---

## 🚀 Évolutions Futures Possibles

1. **Paliers de commission**: Commissions progressives selon le volume
2. **Bonus de performance**: Récompenses pour les meilleurs partenaires
3. **Dashboard partenaire**: Interface dédiée aux partenaires
4. **Rapports automatiques**: Génération de rapports mensuels
5. **Paiements automatisés**: Intégration avec système de paiement

---

## 📞 Support

Pour toute question sur le système de commission:
- Documentation technique: `/docs/api`
- Code source: `/admin-panel` et `/Hanouti-Api`

---

**Dernière mise à jour:** 8 Novembre 2025
