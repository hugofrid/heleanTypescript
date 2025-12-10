const arrayName = ["roles"] as const
const numbersName = ["lat", "lon", "zip"] as const

type Expect<Test, Type extends Test> = Type

//transform '#u, address.city, #a.geo.lat, roles.name'  in ['#u', 'address.city', '#a.geo.lat', 'roles.name']

type ExtractProjectedItemKeysList<T extends string> =
  T extends `${infer Key1}, ${infer KeyRest}`
    ? [Key1, ...ExtractProjectedItemKeysList<KeyRest>]
    : [T]

type BadItemKeysList = Expect<
  ["#u", "address.city", "#a.geo.lat"],
  // @ts-expect-error
  ExtractProjectedItemKeysList<"#u, address.city, #a.geo.lat, roles.name">
>

type ItemKeysList = Expect<
  ["#u", "address.city", "#a.geo.lat", "roles.name"],
  ExtractProjectedItemKeysList<"#u, address.city, #a.geo.lat, roles.name">
>
// transforme'#u, address.city, #a.geo.lat, roles.name' in '#u' | 'address.city' | '#a.geo.lat' | 'roles.name'
type ExtractProjectedItemKeysType<T extends string> =
  ExtractProjectedItemKeysList<T>[number]

type BadItemKeysType = Expect<
  "#u" | "address.city" | "#a.geo.lat",
  // @ts-expect-error
  ExtractProjectedItemKeysType<"#u, address.city, #a.geo.lat, roles.name">
>

type ItemKeysType = Expect<
  "#u" | "address.city" | "#a.geo.lat" | "roles.name",
  ExtractProjectedItemKeysType<"#u, address.city, #a.geo.lat, roles.name">
>

// find the key in Names to replace it like #u in username
type MapKey<
  Key extends string,
  Names extends Record<string, string>
> = Key extends keyof Names
  ? Names[Key]
  : Key extends keyof Names
  ? Names[Key] extends string
    ? Names[Key]
    : Key
  : Key

type goodMappedType = Expect<"username", MapKey<"#u", typeof names>>
type goodMappedType2 = Expect<"u", MapKey<"u", typeof names>>

// @ts-expect-error
type BadMappedType = Expect<"#a", MapKey<"#a", typeof names>>
// @ts-expect-error
type BadMappedType2 = Expect<"country", MapKey<"#c", typeof names>>

// Get the type of value from the arrayName list and return as array in that case
type ExtractArrayOrObjectType<
  T extends string,
  C extends object
> = T extends (typeof arrayName)[number] ? Array<C> : C

// map key recursivly to create object or return value as string or number depending on the numbersName
type ExtractProjectedItemObjectKeys<
  T extends string,
  Names extends Record<string, string>
> = T extends `${infer Key}.${infer Value}`
  ? Partial<
      Record<
        MapKey<Key, Names>,
        ExtractArrayOrObjectType<
          MapKey<Key, Names>,
          ExtractProjectedItemObjectKeys<Value, Names>
        >
      >
    >
  : Record<
      MapKey<T, Names>,
      MapKey<T, Names> extends (typeof numbersName)[number] ? number : string
    >

type BadItemObjectKeysPartial = Expect<
  { address: { city?: string } },
  // @ts-expect-error
  ExtractProjectedItemObjectKeys<"address.city", typeof names>
>
type BadItemObjectKeys = Expect<
  { "#a": { geo: { lat: string } } },
  // @ts-expect-error
  ExtractProjectedItemObjectKeys<"#a.geo.lat", typeof names>
>
type BadItemObjectKeys2 = Expect<
  { "#a": { geo?: { lon: string } } },
  // @ts-expect-error
  ExtractProjectedItemObjectKeys<"#a.geo.lat", typeof names>
>
type BadItemObjectKeysType = Expect<
  { address?: { geo?: { lat: string } } },
  // @ts-expect-error
  ExtractProjectedItemObjectKeys<"#a.geo.lat", typeof names>
>

type ItemObjectKeys = Expect<
  { address?: { geo?: { lat: number } } },
  ExtractProjectedItemObjectKeys<"#a.geo.lat", typeof names>
>
type ItemObjectKeys2 = Expect<
  { username: string },
  ExtractProjectedItemObjectKeys<"#u", typeof names>
>

//transform union into intersection
type UnionToIntersection<U> = (U extends any ? (x: U) => void : never) extends (
  x: infer I
) => void
  ? I
  : never

//extract Projected item into object
type ExtractProjectedItemToObject<
  T extends string,
  Names extends Record<string, string>
> = UnionToIntersection<
  {
    [Item in ExtractProjectedItemKeysType<T>]: ExtractProjectedItemObjectKeys<
      Item,
      Names
    >
  }[ExtractProjectedItemKeysType<T>]
>

type ItemToObject = Expect<
  {
    address?: { geo?: { lat: number } }
    roles?: Array<{ name: string }>
  },
  ExtractProjectedItemToObject<"#a.geo.lat, roles.name", typeof names>
>
type ItemToObject2 = Expect<
  { username: string; address?: { geo?: { lat: number } } },
  ExtractProjectedItemToObject<"#u, #a.geo.lat", typeof names>
>
type ItemToObject3 = Expect<
  {
    username: string
    address?: { geo?: { lat: number; lon: number } }
  },
  ExtractProjectedItemToObject<"#a.geo.lat, #a.geo.lon, #u", typeof names>
>

type BadItemToObject = Expect<
  {
    username: string
    address?: { geo?: { lat: string } }
  },
  // @ts-expect-error
  ExtractProjectedItemToObject<"#u, #a.geo.long", typeof names>
>

type badItemToObject2 = Expect<
  { "#u": string; "#a"?: { geo?: { lat: string } } },
  // @ts-expect-error
  ExtractProjectedItemToObject<
    "#a.geo.lat, #u, address.country,address",
    typeof names
  >
>

//RESOLUTION
type ExpectType<T extends object> = T

// check if it extends value or return false to use it with the Expect type
type ExtractProjectedItem<
  Item,
  ProjectionExpression extends string,
  Names extends Record<string, string>
> = Item extends ExtractProjectedItemToObject<ProjectionExpression, Names>
  ? ExtractProjectedItemToObject<ProjectionExpression, Names>
  : false

type UserItem = {
  id: string
  username: string
  metadata?: {
    createdAt: string
    updatedAt: string
  }
  address?: {
    city: string
    zip: number
    geo?: {
      lat: number
      lon: number
    }
  }
  roles: Array<{
    name: string
    expiresAt?: string
  }>
}

// @ts-expect-error
type Bad = ExpectType<ExtractProjectedItem<UserItem, "address.country", {}>>

const projection = "#u, address.city, #a.geo.lat, roles.name" as const
const names = { "#u": "username", "#a": "address" } as const

type ResultTest = ExpectType<
  ExtractProjectedItem<UserItem, typeof projection, typeof names>
>
type Result = ExtractProjectedItem<UserItem, typeof projection, typeof names>

const item: {
  username: string
  address?: {
    city: string
    geo?: {
      lat: number
    }
  }
  roles?: Array<{
    name: string
  }>
} = null as unknown as ExtractProjectedItem<
  UserItem,
  typeof projection,
  typeof names
>

//BONUS
const names2 = { "#m": "metadata", "#t": "updatedAt" } as const
const projection2 = "#m.#t" as const

type Bonus = Expect<
  {
    metadata?: {
      updatedAt: string
    }
  },
  ExtractProjectedItem<UserItem, typeof projection2, typeof names2>
>

/**
 * Remarques
 * - comment déterminer les arrays autrements qu'avec la liste as const
 * - comment déterminer les champs optionnels autre que part la présence de sous niveau ou par leurs noms [updatedAt,expireAt,roles],
 *   mais dans ce cas, il faut rajouter encore une condition différente dans le cas d'un array
 * - comment gérer la déclaration d'erreur typescript avec la déclaration
 *      type ExtractProjectedItem<
 *       Item,
 *       ProjectionExpression extends string,
 *       Names extends Record<string, string>
 *      >
 *  sans utiliser un typage de plus
 *
 */
