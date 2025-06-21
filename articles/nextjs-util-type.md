---
title: "Next.jsの内部実装で使われているカスタムユーティリティ型"
emoji: "🐙"
type: "tech" # tech: 技術記事 / idea: アイデア
topics: [TypeScript,Nextjs,contest2025ts]
published: false
---
## はじめに
Next.jsの内部実装をみていたときに、`Pick`や`Partial`のようなTypeScriptに組み込みで用意されているユーティリティ型ではなく、いくつか独自で定義されたカスタムユーティリティ型が使用されていたのでその型の仕組みや用途について見ていきたいと思います。

みていくNext.jsのバージョンは執筆時点での最新版である`15.3.4`になりますが、型自体は2020年には追加されていたもので、古めのバージョンのTypeScriptでも動作します。

https://github.com/vercel/next.js/pull/15953

## 必須プロパティ・オプショナルプロパティだけを抽出する型
Next.jsには、リンクを表すのに`<a>`タグをよりリッチにした、ソフトナビゲーションやprefetchを行うための`<Link>`というコンポーネントが用意されています。

https://nextjs.org/docs/pages/api-reference/components/link

この`<Link>`コンポーネントは`link.tsx`ファイルにあり、このファイルではオブジェクトの型を型引数としてとり、そのオブジェクトの**必須プロパティのみを持つオブジェクトの型**を構成したり、逆にそのオブジェクトの**オプショナルプロパティのみをもつオブジェクトの型**[^1]を構成するカスタムのユーティリティ型が定義されています。

以下の`link.tsx`はPagesRouterで使用されているものです。
AppRouter用のものは`packages/next/src/client/app-dir/link.tsx`にあり、そちらでも同じ型が定義されています。

https://github.com/vercel/next.js/blob/v15.3.4/packages/next/src/client/link.tsx#L20-L32


### `RequiredKeys`型
`RequiredKeys`型は、オブジェクトの型から必須プロパティのみを抜き出したオブジェクトの型を作成するカスタムユーティリティ型です。

```ts
type RequiredKeys<T> = {
  [K in keyof T]-?: {} extends Pick<T, K> ? never : K
}[keyof T]
```



### `OptionalKeys`型
```ts
type OptionalKeys<T> = {
  [K in keyof T]-?: {} extends Pick<T, K> ? K : never
}[keyof T]
```



[^1]:もともとオプショナルプロパティだったもののみを必須プロパティとしてもつ型となります。