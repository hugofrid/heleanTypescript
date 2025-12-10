# Test Typescript

# **Exercice TypeScript — Extraction de type à partir d’une ProjectionExpression DynamoDB**

## Objectif

Écrire des types utilitaires capables de construire **à partir du type d’un Item DynamoDB**, de :

- `ProjectionExpression` (ex: `"username, #addr.city, #addr.geo.lat"`)
- `ExpressionAttributeNames` (ex: `{ "#addr": "address" }`)

un **type projeté strict**, équivalent à ce que DynamoDB renverrait. Le tout **UNIQUEMENT en TypeScript,** avec ****aucun runtime, aucune fonction JS.

# 1. Type de départ

```tsx
type UserItem = {
  id: string;
  username: string;
  metadata?: {
    createdAt: string;
    updatedAt?: string;
  };
  address?: {
    city: string;
    zip: number;
    geo?: {
      lat: number;
      lon: number;
    };
  };
  roles: Array<{
    name: string;
    expiresAt?: string;
  }>;
};
```

# 2. Inputs fournis : Projection + ExpressionAttributeNames

### Exemple :

```tsx
const projection = "#u, address.city, #a.geo.lat, roles.name";

const names = {
  "#u": "username",
  "#a": "address"
} as const;
```

# 3. Exercice

### **Écrire un type**

```tsx
type ExtractProjectedItem<
  Item,
  ProjectionExpression extends string,
  Names extends Record<string, string>
> = /* ... */
```

Il doit :

### 1. **Résoudre les alias DynamoDB**

Exemple : `" #a.geo.lat "` devient `"address.geo.lat"`

selon `Names`.

### 2. **Découper la projection en chemins**

Ex : `"username, address.city"` →

`["username", "address.city"]`.

### 3. **Valider chaque chemin**

- Erreur si une clé n'existe pas (`"address.country"`).
- Erreur si on tente d’accéder à un tableau comme un objet (`"roles.city"`).

Exemple d’erreur attendue :

```tsx
// @ts-expect-error
type Bad = ExtractProjectedItem<UserItem, "address.country", {}>;
```

### 4. **Construire un type imbriqué minimal**

À partir de :

`"address.geo.lat, username"`

vous devez produire :

```tsx
{
  username: string;
  address: {
    geo: {
      lat: number;
    };
  };
}
```

### 5. **Gérer les propriétés optionnelles correctement**

Si `address` est optionnel mais que `address.geo.lat` est projeté, alors :

```tsx
address?: { geo?: { lat: number } }
```

### 6. **Gérer les tableaux & leurs sous-propriétés**

Si la projection contient :

`roles.name`

Alors le type doit devenir :

```tsx
{
  roles: Array<{
    name: string;
  }>
}
```

# 4. Output attendu pour l’exemple

Avec :

```tsx
const projection = "#u, address.city, #a.geo.lat, roles.name";
const names = { "#u": "username", "#a": "address" } as const;
```

Le type :

```tsx
type Result = ExtractProjectedItem<UserItem, typeof projection, typeof names>;
```

doit équivaloir à :

```tsx
{
  username: string;
  address?: {
    city: string;
    geo?: {
      lat: number;
    };
  };
  roles: Array<{
    name: string;
  }>;
}
```

# Bonus optionnel

### Support des alias sur multiples segments imbriqués

Ex :

```tsx
names = { "#m": "metadata", "#t": "updatedAt" }
projection = "#m.#t"
```

→ doit devenir `"metadata.updatedAt"`.

# 5. Rendu attendu

- Le type `ExtractProjectedItem` entièrement fonctionnel
- Une série de tests avec `// @ts-expect-error` pour valider les cas invalides
- Aucun code JavaScript : *uniquement du typage TS*