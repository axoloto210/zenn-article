---
title: "Next.jsの内部実装で使われているカスタムユーティリティ型 - オプショナルプロパティのキーを取得する型に型操作の基本が詰まっている！"
emoji: "🐠"
type: "tech" # tech: 技術記事 / idea: アイデア
topics: [TypeScript,Nextjs,contest2025ts]
published: true
---
## はじめに
Next.jsの内部実装をみていたときに、`Pick`や`Partial`のようなTypeScriptに組み込みで用意されているユーティリティ型ではなく、いくつか独自で定義されたカスタムユーティリティ型が使用されていたのでその型の仕組みや用途について見ていきたいと思います。

みていくNext.jsのバージョンは執筆時点での最新版である`15.3.4`になりますが、型自体は2020年には追加されていたもので、古めのバージョンのTypeScriptでも動作します。

https://github.com/vercel/next.js/pull/15953

## 必須プロパティ・オプショナルプロパティのキーだけを抽出する型
Next.jsには、リンクを表すのに`<a>`タグをよりリッチにした、ソフトナビゲーション（クライアント側のルーティング）や`prefetch`（ページやデータの事前読み込み）を行うことができる`<Link>`というコンポーネントが用意されています。

https://nextjs.org/docs/pages/api-reference/components/link

この`<Link>`コンポーネントは`link.tsx`ファイルにあり、このファイルではオブジェクトの型を型引数としてとり、そのオブジェクトの型の**必須プロパティキーのみを抽出した型**を構成したり、逆にそのオブジェクトの**オプショナルプロパティキーのみを抽出した型**を構成するカスタムのユーティリティ型が定義されています。

オプショナルプロパティとは、`{foo?: string}`のように`?`のついたプロパティのことで、オブジェクトにこのプロパティがなくても型エラーとなりません。
逆に、`?`のついていないプロパティが必須プロパティで、このプロパティを持たないオブジェクトについては型エラーが発生します。

https://zenn.dev/axoloto210/scraps/2caa329b85f519#comment-1c280566552fa7


以下の`link.tsx`はPagesRouterで使用されているものです。
AppRouter用のものは`packages/next/src/client/app-dir/link.tsx`にあり、そちらでも同じ型が定義されています。

https://github.com/vercel/next.js/blob/v15.3.4/packages/next/src/client/link.tsx#L24-L29

https://github.com/vercel/next.js/blob/v15.3.4/packages/next/src/client/app-dir/link.tsx#L26-L31

### `RequiredKeys`型
`RequiredKeys`型は、オブジェクトの型から必須プロパティキーのみを抜き出した型を作成するカスタムユーティリティ型です。
オブジェクトの型`T`を渡すと、`T`の必須プロパティキーの文字列リテラルのユニオン型が得られます。

```ts
type RequiredKeys<T> = {
  [K in keyof T]-?: {} extends Pick<T, K> ? never : K
}[keyof T]
```

`RequiredKeys`型の型引数に「必須プロパティやオプショナルプロパティを複数もつオブジェクトの型」を渡し、どのような型が得られるかをみてみます。
以下のオブジェクトの型`Obj`には、3つの必須プロパティと3つのオプショナルプロパティが含まれています。
`requiredUndefinedOrNumber: number | undefined;`のように、`undefined`とのユニオン型であったとしても`?`がついていないプロパティは必須プロパティです。

```ts
type Obj = {
  requiredString: string;
  requiredObject: {
    required: string;
    optional?: string;
  };

  optionalString?: string;
  optionalObject?: {
    required: string;
    optional?: string;
  };

  requiredUndefinedOrNumber: number | undefined;
  optionalUndefinedOrNumber?: number | undefined;
};
```

この`Obj`型を`RequiredKeys`の型引数に渡してみると、確かに必須プロパティキーのユニオン型となっています。


```ts
type Test = RequiredKeys<Obj>;
//    ^? type Test = "requiredString" | "requiredObject" | "requiredUndefinedOrNumber"
```

### `OptionalKeys`型
オプショナルプロパティのキーのみを抽出する型で、`RequiredKeys`型とは条件型の分岐部分が異なっています。
```ts
type OptionalKeys<T> = {
  [K in keyof T]-?: {} extends Pick<T, K> ? K : never
}[keyof T]
```
`Obj`型を渡してみると、オプショナルプロパティのキーのみが取得できていることがわかります。
```ts
type Test2 = OptionalKeys<Obj>;
//   ^? type Test2 = "optionalString" | "optionalObject" | "optionalUndefinedOrNumber"
```


### `RequiredKeys`の構成要素
`RequiredKeys`型と`OptionalKeys`型は条件型の分岐部分のみが異なり、基本的な構成は同じため、`RequiredKeys`がどのように構成されているかを見ていきたいと思います。

`RequiredKeys`型は以下を組み合わせて構成されています。
- `{}`型と`never`型
- `Pick`型（ユーティリティ型）
- インデックスアクセス型
- 条件型（Conditional Types）
- マップ型（Mapped Types）とマッピング修飾子（mapping modifier）

#### `{}`型と`never`型
`{}`型の変数には、`null`と`undefined`を除く値を代入することができます。
`{}`はプロパティをもたないオブジェクトの型であり、オプショナルプロパティのみをもつオブジェクトであれば代入可能ですが、必須プロパティを1つでももつと型エラーとなります。

また、`never`型の変数にはいかなる値も代入することができません。
`never`型は、`never`以外の他の型とのユニオン型をとると、`never`部分はユニオンからなくなります。

たとえば`string | never`型は`string`型になります。
`never`型は空集合のようなもので、他の集合との和集合をとっても結果が変わらないわけです。

https://zenn.dev/axoloto210/articles/advent-calender-2023-day10

#### `Pick`型
`Pick`型は`Pick<Type, Keys>`のようにオブジェクトの型`Type`とオブジェクトのプロパティキーの文字列リテラル型のユニオン型`Keys`を指定することで、指定したプロパティキーをもつオブジェクトの型を作成できます。

```ts
type PickedBaseObj = {
    pickedString: string
    pickedNumber: number
    other: string
}

type PickedObj = Pick<PickedBaseObj, 'pickedString'|'pickedNumber'>
//   ^? type PickedObj = {
//          pickedString: string;
//          pickedNumber: number;
//      }
```

https://www.typescriptlang.org/docs/handbook/utility-types.html#picktype-keys

#### インデックスアクセス型
インデックスアクセス型を使うことで、オブジェクトの型からプロパティの型を抽出することができます。
配列やオブジェクトのインデックスアクセスのようにキーを指定することで、プロパティの型を取得します。

文字列リテラルのユニオン型で指定した場合には、ユニオン型の形でプロパティの型を抽出できます。

```ts
type IndexedAccessBaseObj = {
    indexedString: string
    indexedNumber: number
    other: number
}

type IndexedAccessObj = IndexedAccessBaseObj['indexedString' | 'indexedNumber']
//   ^? type IndexedAccessObj = string | number
```

#### 条件型（Conditional Types）
`T extends string ? number : boolean`のように、`extends`と三項演算子(`? :`)のような記法を組み合わたものが条件型で、この例では、`T`が`string`の部分型であれば`?`の後にある`number`型、部分型でなければ`:`の後にある`string`型となります。
```ts
type Conditional<T> = T extends string ? number : boolean

type ConditionalString = Conditional<string>
//   ^? type ConditionalString = number
type ConditionalNumber = Conditional<number>
//   ^? type ConditionalNumber = boolean
```

#### マップ型（Mapped Types）とマッピング修飾子（mapping modifier）
マップ型を使用することで、オブジェクトの型から別のオブジェクトの型を作成することができます。
オブジェクトのプロパティキーを別のオブジェクトの型へとマッピングできるわけです。

例えば、以下の例では`Type`として渡したオブジェクトの型からは、プロパティがすべて`boolean`型のオブジェクトの型が得られます。

```ts
type OptionsFlags<Type> = {
  [Property in keyof Type]: boolean;
};
```
https://www.typescriptlang.org/docs/handbook/2/mapped-types.html

また、マッピング修飾子を使用することで、`readonly`や`?`（オプショナルプロパティかどうか）をつけたり外したりすることができます。

`-?`を指定することで、必須プロパティにすることができます。
```ts
type MappedBaseType = {
  foo?: string;
  bar?: number;
};

type RequiredMappedType = {
  [K in keyof MappedBaseType]-?: MappedBaseType[K];
};
// type RequiredMappedType = {
//   foo: string;
//   bar: number;
// }
```
`keyof MappedBaseType`は`"foo" | "bar"`となります。
この`"foo"`と`"bar"`それぞれに対して、修飾子のつけ外しやプロパティの型の指定を行っていくイメージです。
```ts
{
    "foo": MappedBaseType["foo"] // foo?から?を除く。
    "bar": MappedBaseType["bar"] // bar?から?を除く。
}
```
https://www.typescriptlang.org/docs/handbook/2/mapped-types.html#mapping-modifiers

### `RequiredKeys`の仕組み
再度`RequiredKeys`の構造を見てみます。
```ts
type RequiredKeys<T> = {
  [K in keyof T]-?: {} extends Pick<T, K> ? never : K
}[keyof T]
```
`RequiredKeys`はマップ型`{ [K in keyof T]-?: {} extends Pick<T, K> ? never : K }`でオブジェクトの型を作成し、インデックスアクセス`[keyof T]`によってプロパティの型のユニオン型を取得しています。

マップ型の部分について詳しくみてみます。
`[K in keyof T]-?`の部分では、オブジェクトの型`T`から新しくオブジェクトの型を作る際に、オプショナルプロパティをすべて必須プロパティにしています。

条件型`{} extends Pick<T, K> ? never : K `の部分をみてみます。
`Pick<T,K>`は、プロパティキー`K`によって`T`のプロパティの型を抽出しています。

この`{}`が`Pick<T,K>`の部分型であれば、マップ型のプロパティキー`K`に対応するプロパティの型は`never`型となり、そうでなければプロパティキー`K`になります。

`{}`が`Pick<T,K>`の部分型であるとは、`{}`型の値が`Pick<T,K>`の変数に代入できることです。
`K`がオプショナルプロパティのキーのときには、`Pick<T,K>`は`{foo?: number}`のように`?`がついたプロパティを1つもつオブジェクトの型となります。
`{}`はプロパティをもたないオブジェクトの型ですので、オプショナルプロパティのみをもつオブジェクトであれば代入できます。

`{} extends Pick<T, K> ? never : K`によって、`T`の必須プロパティキーに対しては値としてプロパティキーをもち、`T`のオプショナルプロパティキーに対しては値の型として`never`をもつことになります。


マップ型で作成されるオブジェクトの型は以下のコメントアウトの箇所のような形になります。
```ts
type RequiredObj<T> = {
  [K in keyof T]-?: {} extends Pick<T, K> ? never : K;
};

type MappedObj = RequiredObj<Obj>;
// type MappedObj = {
//     requiredString: "requiredString";
//     requiredObject: "requiredObject";
//     optionalString: never;
//     optionalObject: never;
//     requiredUndefinedOrNumber: "requiredUndefinedOrNumber";
//     optionalUndefinedOrNumber: never;
// }
```
`-?`が指定されていない場合には、`never`の部分が`undefined`となってしまい、`[keyof T]`でインデックスアクセス型を取得すると、ユニオン型に`undefined`が含まれてしまうわけです。
（`never`とのユニオン型であれば、`never`はユニオン型から消えてくれるのでした。）

このマップ型に`T`のプロパティキーのユニオン型`keyof T`によるインデックスアクセス型を取得すると、必須プロパティのキーと`never`のユニオン型が得られます。

`never`はユニオンをとると消えますので、最終的に必須プロパティのキーが取得できるわけです。

### さいごに
Next.jsで使用されているカスタムユーティリティ型をみていきました（Next.jsに限らず使用されている型です）。
マップ型や条件型といった、型操作を行う上でよく使用される機能の組み合わせで実用的なカスタムユーティリティ型が作成されていました。
これだけ機能が組み合わさっていると、カスタムユーティリティ型として分けられているありがたみを感じられそうですね。

この型の仕組みがわかるようになると、読める・使える型操作の幅が広がりそうです。
