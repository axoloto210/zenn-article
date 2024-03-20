---
title: "型推論を抑えるためのユーティリティ型！？ NoInfer型"
emoji: "🍣"
type: "tech" # tech: 技術記事 / idea: アイデア
topics: [TypeScript]
published: true
---
## `NoInfer<T>`型
TypeScript 5.4から`NoInfer`型というユーティリティ型が追加されました。
https://devblogs.microsoft.com/typescript/announcing-typescript-5-4/#the-noinfer-utility-type
`Pick`や`Partial`など従来のユーティリティ型というのは、与えられた型から新しい型を作るものがほとんどでしたが、今回追加された`NoInfer`型は名前の通り、TypeScriptのコンパイラによる型推論を抑えるための型となっています。

### 型推論
TypeScriptでは、`const num: number = 1`のように型注釈をつけて明示的に型をつけることができますが、型注釈をつけなかった場合にもコンパイラが自動的に型を推測してつけてくれます。
これが型推論と呼ばれるものですが、実装者側が意図している型とは異なる型として推論されてしまうケースもあります。
いままでは意図した型として推論してもらうために型の付け方を工夫する必要があり、そのために記述が長く複雑になってしまう場合もありました。
`NoInfer`型はこのような冗長な記述の削減に役立つユーティリティ型となっています。

### `Noinfer`で型推論を抑えてみる
`NoInfer`型を使用するとどのように型推論が行われるようになるのかを、文字列2つを引数にとる関数を例に見てみたいと思います。
```ts: noInferExample.ts
function func<T extends string>(a: T, b: T): void { }

function noInferFunc<T extends string>(a: T, b: NoInfer<T>): void { }

func('abc', 'abc') //function func<"abc">(a: "abc", b: "abc"): void
noInferFunc('abc', 'abc') //function noInferFunc<"abc">(a: "abc", b: "abc"): void


func('abc', '123')// function func<"abc" | "123">(a: "abc" | "123", b: "abc" | "123"): void

noInferFunc('abc', '123')// function noInferFunc<"abc">(a: "abc", b: "abc"): void
//Argument of type '"123"' is not assignable to parameter of type '"abc"'.(2345)
```


上のコード例にある2つの関数は第2引数に`NoInfer<T>`を設定しているかの点のみが異なっています。
```ts
function func<T extends string>(a: T, b: T): void { }

function noInferFunc<T extends string>(a: T, b: NoInfer<T>): void { }
```

この2つの関数に同じ文字列2つを渡した場合には同じ関数型として型推論されます。
```ts
func('abc', 'abc') //function func<"abc">(a: "abc", b: "abc"): void

noInferFunc('abc', 'abc') //function noInferFunc<"abc">(a: "abc", b: "abc"): void
```

しかし、異なる文字列を渡した場合には推論結果が異なってきます。
```ts
func('abc', '123')// function func<"abc" | "123">(a: "abc" | "123", b: "abc" | "123"): void

noInferFunc('abc', '123')// function noInferFunc<"abc">(a: "abc", b: "abc"): void
//Argument of type '"123"' is not assignable to parameter of type '"abc"'.(2345)
```
`func`関数では引数の型がリテラル型のユニオン`"abc" | "123"`と推論されています。
関数の引数として`'abc'`と`'123'`という文字列を受け入れられるような型を、`string`型の部分型という制約（`T extends string`）の範囲内で推論した結果が、リテラル型のユニオン`"abc" | "123"`となってるわけです。

`noInferFunc`の場合には第2引数に関して型推論を行わないようになっているため、関数の型推論の結果が異なっています。
第1引数`a`に関しては`'abc'`型であると推論されていますが、第2引数`b`については型推論が抑えられた結果、型引数`T`は`'abc'`型であると推論されています。
このため、第2引数には第1引数で推論された型の部分型以外の値が渡されると型エラーが発生するようになっています。

```ts
noInferFunc('abc', '123')// function noInferFunc<"abc">(a: "abc", b: "abc"): void
//Argument of type '"123"' is not assignable to parameter of type '"abc"'.(2345)
```
```Argument of type '"123"' is not assignable to parameter of type '"abc"'.(2345)```
第2引数の型は第1引数の型と同じ型（とその部分型）であるという制約が課せていますね。

### `NoInfer`を使わない場合
```ts
//NoInfer型を使用せずに記述した場合
function funcWithoutNoInfer<T extends string, U extends T>(a: T, b: U): void { }
funcWithoutNoInfer('abc', 'abc')// function funcWithoutNoInfer<"abc", "abc">(a: "abc", b: "abc"): void

funcWithoutNoInfer('abc', '123')// function funcWithoutNoInfer<"abc", "abc">(a: "abc", b: "abc"): void
//Argument of type '"123"' is not assignable to parameter of type '"abc"'.(2345)
```
上のように型に制約を追加することで、`NoInfer`を使用せずとも第1引数と第2引数が同じ型と推論されるようにもできます。
しかし、他の箇所で使用されない型引数`U`が追加されたことで冗長になってしまっています。
`NoInfer`型を使用することで、このようなコードを簡潔に書くことができるようになります。

<br/>

ちなみに引数の両方に`NoInfer`をつけた場合には`string`に型推論されます。
引数として渡された値の情報が型推論に使用されなくなっているわけですね。
```ts
// 引数すべてをNoInferとすると型推論が行われなくなっている
function allNoInferFunc<T extends string>(a: NoInfer<T>, b: NoInfer<T>): void { }

allNoInferFunc('abc', 'abc')// function allNoInferFunc<string>(a: string, b: string): void
```

## `NoInfer<T>`の実装
`NoInfer`の定義元に飛んでみると、以下のようになっています。
```ts: node_modules/typescript/lib/lib.es5.d.ts
/**
 * Marker for non-inference type position
 */
type NoInfer<T> = intrinsic;
```
`intrinsic`というのはTypeScriptのコンパイラが提供する実装を参照することを表しています。

`NoInfer`型のコンパイラでの実装は以下のPRに記載されています。
https://github.com/microsoft/TypeScript/pull/56794
PRでは、`NoInfer`型は**marker type**と呼ばれており、コンパイラが推論を行わないようにする印（マーカー）として機能しています。

## `NoInfer<T>`と`T`は同一の型として扱える
`NoInfer<T>`型は推論を抑制するという点以外では、`T`に一切の影響を与えないとPR内で言及されています。
>Other than blocking inference, NoInfer<T> markers have no effect on T. Indeed, T and NoInfer<T> are considered identical types in all other contexts.

TypeScriptコンパイラのテストにも、`T`がプリミティブ型の場合など推論に影響を与えない場合に`NoInfer`が削除されて型が表示されるかというケースが含まれています。

https://github.com/microsoft/TypeScript/blob/309fd3db81955ef7a4dd55a80e333b2b767717a7/tests/baselines/reference/noInfer.errors.txt#L1-L125

## 使いどころ
主には`function funcWithoutNoInfer<T extends string, U extends T>(a: T, b: U): void { }`での例のように別の型引数の推論結果をそのまま使いたいシーンで活用できると思います。

推論された結果（`T`の型推論結果）をそのまま使用したい箇所（今回の例では`U`の箇所）で`NoInfer<T>`とすることで、推論結果に影響を与えずに型を記述していけます。

型を変数のように扱えるようになり嬉しいですね。
