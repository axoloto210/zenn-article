---
title: "Next.jsの内部実装で使われているカスタムユーティリティ型 - オプショナルプロパティのキーを取得する型に型操作の基本が詰まっている！"
emoji: "🐙"
type: "tech" # tech: 技術記事 / idea: アイデア
topics: [TypeScript,Nextjs,contest2025ts]
published: false
---
## はじめに
Next.jsの内部実装をみていたときに、`Pick`や`Partial`のようなTypeScriptに組み込みで用意されているユーティリティ型ではなく、いくつか独自で定義されたカスタムユーティリティ型が使用されていたのでその型の仕組みや用途について見ていきたいと思います。

みていくNext.jsのバージョンは執筆時点での最新版である`15.3.4`になりますが、型自体は2020年には追加されていたもので、古めのバージョンのTypeScriptでも動作します。

https://github.com/vercel/next.js/pull/15953

## 必須プロパティ・オプショナルプロパティのキーだけを抽出する型
Next.jsには、リンクを表すのに`<a>`タグをよりリッチにした、ソフトナビゲーション（クライアント側のルーティング）やprefetch（ページやデータの事前読み込み）を行うことができる`<Link>`というコンポーネントが用意されています。

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

`RequiredKeys`型に「必須プロパティやオプショナルプロパティを複数もつオブジェクトの型」を渡し、どのような型が得られるかをみてみます。
このオブジェクトの型`Obj`には、3つの必須プロパティと3つのオプショナルプロパティが含まれています。
` requiredUndefinedOrNumber: number | undefined;`のように、`undefined`とのユニオン型であったとしても`?`がついていないプロパティは必須プロパティとなります。

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

この`Obj`型を`RequiredKeys`型に渡してみると、確かに必須プロパティキーの文字列リテラルのユニオン型となっています。


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


### `RequiredKeys`の構成
`RequiredKeys`型と`OptionalKeys`型は条件型の分岐部分のみが異なり、基本的な構成は同じため、`RequiredKeys`がどのように構成されているかを見ていきたいと思います。

`RequiredKeys`型は以下を組み合わせて構成されています。
- `{}`型と`never`型
- `Pick`型（ユーティリティ型）
- インデックスアクセス型
- 条件型（Conditional Types）
- Homomorphic Mapped Types


### さいごに
Next.jsで使用されているカスタムユーティリティ型をみていきました。
Homomorphic Mapped Typesや条件型といった型操作を行う上でよく使用される機能の組み合わせで実用的なカスタムユーティリティ型が作成されていました。
これだけ機能が組み合わさっていると、カスタムユーティリティ型として分けられているありがたみを感じられるように思います。

この型の仕組みがわかるようになると、読める・使える型操作の幅が広がりそうですね。

