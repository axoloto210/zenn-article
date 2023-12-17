---
title: "オブジェクト型を支えるlookup型とkeyof型"
emoji: "🎄"
type: "tech" # tech: 技術記事 / idea: アイデア
topics: [TypeScript, JavaScript, adventcalendar]
published: true
published_at: 2023-12-17 21:15
---
オブジェクトはプロパティの型やオブジェクト自身の型など、複数の型が組み合わさってできていますが、このオブジェクト型を扱いやすくする機能として、`lookup`型と`keyof`型があります。
## `lookup`型
`lookup`型は主にオブジェクトのプロパティの型を得るために使用されます。オブジェクトの型`T`とオブジェクトのキーの型`K`を用いて`T[K]`のように記述します。
```ts
type Obj = {
    num: number
    str: string
}

//type T = number
type T = Obj['num']
```
`lookup`型を使用することで、`Obj`型のプロパティの型を変更するときに変更箇所の数を抑えられる利点がある一方で、型情報を知りたい場合には元のオブジェクト型を参照する必要が出てくることには注意が必要です。

また、あまり使い道はないように思いますが、`lookup`型は`123`などのリテラル型や`string`などのプリミティブ型に適用することも可能です。
その場合には`Number`型や`String`型などのラッパーオブジェクトがもつインスタンスメソッドなど、リテラル型やプリミティブ型の値でもアクセス可能なプロパティのキー文字列を渡すことで型情報を取得することができます。
```ts
//type U = () => string
type U = '123'['toString'] 

//type V = (radix?: number | undefined) => string
type V = 123['toString']
```
（ラッパーオブジェクトについては以下の記事でも触れていますのでよければ。）
https://zenn.dev/axoloto210/articles/advent-calender-2023-day03

どのプロパティにアクセスできるかは、次に紹介する`keyof`型を使用して調べることもできます。
```ts
//type W = "toString" | "toFixed" | "toExponential" | "toPrecision" | "valueOf" | "toLocaleString"
type W = keyof 123
```
## `keyof`型
`keyof`型はオブジェクト型からプロパティ名のキー文字列を（複数の時はユニオン型で）取得できる機能です。
```ts
type Obj = {
    num: number
    str: string
}

type T = keyof Obj

const key: T = 'num'
const key2: T = 'str'
const key3: T = 'foo' //Type '"foo"' is not assignable to type 'keyof Obj'.(2322)
```
上のコード例では`Obj`型のプロパティ名のユニオン型である`'num' | 'str'`に適合しない値を代入しようとしてコンパイルエラーが発生しています。

この`keyof`は型に対して使用できる演算子であり、オブジェクトリテラルなどの値には直接適用することができません。
しかし、`typeof`型演算子を併せて利用することでオブジェクトリテラルのプロパティ名の型情報を取得することが可能になります。
```ts
const obj = {
    num: 123,
    str: 'one-two-three'
}

//type T = "num" | "str"
type T = keyof typeof obj
```
（`typeof`は型演算子の方です。）
https://zenn.dev/axoloto210/articles/advent-calender-2023-day16

## `lookup`と`keyof`を組み合わせる
`lookup`型と`keyof`型を併用することで、オブジェクトからプロパティを取得したり、プロパティに値を設定する関数の方を記述しやすくなります。
```ts
function getProperty<T, K extends keyof T>(obj: T, key: K): T[K] {
  return obj[key]
}

function setProperty<T, K extends keyof T>(obj: T, key: K, value: T[K]): void {
  obj[key] = value
}

const obj = {
    num: 123,
    str: 'one-two-three'
}

console.log(getProperty(obj,'num'))//123 
setProperty(obj, 'num', 321)
console.log(getProperty(obj,'num'))//321 


//Argument of type '"foo"' is not assignable to parameter of type '"num" | "str"'.(2345)
setProperty(obj, 'foo', true)

```
`getProperty`は2つの引数`obj`と`key`を受け取りますが、`K extends keyof T`によって、`key`の型は`obj`のプロパティ名（のユニオン型）の部分型でなければならないという制約が課されています。
この制約のおかげで、オブジェクトに存在しないプロパティを取得しようとしていた場合にはコンパイルエラーが発生して、記述の誤りを検知してもらえるわけですね。

https://www.typescriptlang.org/docs/handbook/release-notes/typescript-2-1.html
