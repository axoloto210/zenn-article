---
title: "PickやPartialなどのユーティリティ型はどのように作られているか？"
emoji: "🎄"
type: "tech" # tech: 技術記事 / idea: アイデア
topics: [TypeScript, JavaScript, adventcalendar]
published: true
published_at: 2023-12-21 22:20
---
## ユーティリティ型（組み込み型）
TypeScriptにはよく使われる形の型や汎用性の高い便利な型がすでに用意されています（TypeScriptに標準で組み込まれている）。
ユーティリティ型は、keyof型、lookup型、Mapped Types、Conditional Types などの組み合わせによって実装されているケースが多いです。
https://zenn.dev/axoloto210/articles/advent-calender-2023-day17
よく使われている組み込み型がどのように実装されているかをみていきたいと思います。

## `Readonly`型
`Readonly<T>`型は、引数として受け取ったオブジェクト型`T`のプロパティを`readonly`にします。
```ts
type Readonly<T> = {
    readonly [P in keyof T]: T[P];
};
```
`Readonly`型は上のような実装となっており、Mapped Typesとlookup型の組み合わせによって実装されていることがわかります。
`T[P]`の部分がlookup型です。オブジェクト型`T`に含まれるプロパティキー`P`をもつプロパティの型が`T[P]`です。
`[P in keyof T]: T[P]`の部分がMapped Typesと呼ばれるもので、オブジェクト型`T`に含まれるプロパティの型が`T[P]`となります。つまり、オブジェクト型`T`のコピーがこの部分で作られているわけですね。
Mapped Typesにはmapping修飾子の設定が可能で、`readonly`とオプショナルプロパティ`?`を付加もしくは`-readonly`、`-?`による除去が可能となっています。`T`のコピーの型のプロパティキーに`readonly`をつけることで、各プロパティへの`readonly`付与が実現できています。
`Readonly<T>`は`T`のプロパティに含まれるオブジェクトのプロパティまでは`readonly`としない性質が知られていますが、`T`のプロパティキーそれぞれにのみ`readonly`がつけられているためであることが実装からわかります。

## `Pick`型
`Pick<T, K>`型は、オブジェクト型`T`から`K`で指定したキーをもつプロパティを取り出して新しいオブジェクト型を作り出す組み込み型です。`K`には`T`型のキーをユニオン型で指定できます。
```ts
type Pick<T, K extends keyof T> = {
    [P in K]: T[P];
};
```
`Pick`型の実装はこのようになっています。
`K extends keyof T`部分によって、`K`は`T`のプロパティキーのユニオン型の部分型であるという条件が課されています。
Mapped Typesによって、`K`を構成するキーをもつプロパティのみで構成されるオブジェクト型が得られています。オブジェクト型`T`をコピーして新たに型をつくるという構造が`Readonly<T>`型と共通しており、実装が似た形となっていますね。

## `Partial`型
`Partial<T>`型は、型`T`のプロパティをオプショナルにする型です。
```ts
type Partial<T> = {
    [P in keyof T]?: T[P];
};
```
`Partial<T>`型の実装は`Readonly<T>`とほとんど同じ実装になっています。
オブジェクトの型`T`の各プロパティをMapped Typesとmapping修飾子`?`によってオプショナルなものにしています。

## `Required`型
`Required<T>`型は、`Partial<T>`型とは逆で、オプショナルな型をオプショナルではなくします。実装としては、mapping修飾子が`-?`となっている点のみがPartial型と異なります。
```ts
type Required<T> = {
    [P in keyof T]-?: T[P];
};
```
## `Extract`型
`Extract<T, U>`型は、型`T`から型`U`の部分型となる型を抽出する組み込み型です。`T`にはユニオン型が指定されることが多いです。
```ts
type Extract<T, U> = T extends U ? T : never;
```
`Extract<T, U>`型はConditional Typesを使用して実装されています。
Conditional Typesは三項演算子と似た構文で、例えば`T extends U ? T : never`の場合、`T`が`U`の部分型、つまり`T extends U`という条件を満たすならば`T`型となり、部分型でなければ`never`型となります。
このConditional Typesは`T`にユニオン型を指定した場合にはユニオン型の分配が行われるという少々難解な特徴があります。
```ts
type ToArray<T> = T extends string ? T[] : never

//type UnionArray = "octopus"[] | "squid"[]
type UnionArray = ToArray<"octopus"|"squid"> 
```
`UnionArray`の型としては、`"(octopus"|"squid")[]`という型になりそうですが、実際にはユニオン型の構成要素が分配され、`"octopus"[] | "squid"[]`型となります。
`Extract<T, U>`型はユニオン型の分配という特徴を知らずとも、Conditional Typesによる型の抽出が行える点で意義がありそうですね。

## `Exclude`型
`Exclude<T, U>`型は、`Extract<T, U>`とは反対に、型`T`から型`U`の部分型となる型を取り除く組み込み型です。
```ts
type Exclude<T, U> = T extends U ? never : T;
```
元のコードも`Exclude<T, U>`の場合と結果が逆になるよう実装されていますね。

## `Omit`型
`Omit<T, K>`型は`Pick<T, K>`型とは反対に、`K`で指定したキーをもつプロパティを除いたオブジェクト型を返します。
```ts
type Omit<T, K extends keyof any> = Pick<T, Exclude<keyof T, K>>;
```
`Omit<T, K>`の実装は`Pick`と`Exclude`を利用して実装されています。
`Pick`型とは異なり、`Omit`型の`K`に課されている制約は`K extends keyof any`となっており、`T`のキー以外のプロパティキーも指定が可能な実装となっています。
`Exclude<keyof T, K>`の部分で`T`のプロパティキーから`K`で指定したキーを取り除いた型が得られます。
つまり、`Pick<T, Exclude<keyof T, K>>`は`T`のプロパティの内、`K`に含まれるキーをもたないプロパティのみで新しくオブジェクト型を構成していることとなります。
## そのほかのユーティリティ型
汎用性が高いが実装が難解な型付けをユーティリティ型が担ってくれています。
今回みた型の他にも数多のユーティリティ型がTypeScriptには用意されていますので、複雑な型を定義する前に使える型がないか探してみるのもよさそうですね。
https://www.typescriptlang.org/docs/handbook/utility-types.html