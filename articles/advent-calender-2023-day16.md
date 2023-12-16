---
title: "どっちのtypeof？"
emoji: "🤶"
type: "tech" # tech: 技術記事 / idea: アイデア
topics: [TypeScript, JavaScript, adventcalendar]
published: true
---
## 2種類の`typeof`
値の型情報を取得するための演算子として`typeof`という演算子があります。この`typeof`にはJavaScriptで使用されている`typeof`とTypeScriptの型演算子としての`typeof`があります。
## JavaScriptの`typeof`演算子
JavaScriptにおける`typeof`演算子は、値の型を文字列で返す演算子です。
JavaScriptの型について、`typeof`は以下のような値を返します。
| Type | `typeof`の返り値 |
| ---- | ---- |
| Null | `"object"`|
| Undifined | `"undefined"` |
| Boolean | `"boolean"` |
| Number | `"number"` |
| String | `"string"` |
| Bigint | `"bigint"` |
| Symbol | `"symbol"` |
| 関数オブジェクト | `"function"` |
| その他のオブジェクト | `"object"` |

以下のコードのようにオブジェクトの型をプロパティを含めて詳しく見たいと思っても、`"object"`しか返ってきません。これは、JavaScriptの`typeof`演算子が文字列を返しているからというわけですね。
```ts
const obj = {
  num: 1,
  str: 'one'
}

console.log(typeof obj)// "object" 
```
`typeof`は`null`に対しても`"object"`を返すという点にも注意が必要です。
```ts
console.log(typeof {num: 1} === typeof null) //true 
```
この挙動はJavaScriptのバグなのですが、`"null"`を返すよう修正を行なってしまうと既存のコードが破壊されることが懸念されるため、修正はされない方針となっているようです。
>In JavaScript, typeof null is 'object', which incorrectly suggests that null is an object (it isn’t, it’s a primitive value, consult my blog post on categorizing values for details). This is a bug and one that unfortunately can’t be fixed, because it would break existing code. Let’s explore the history of this bug.

https://2ality.com/2013/10/typeof-null.html
https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/typeof#typeof_null

## TypeScriptの`typeof`型演算子
TypeScriptにも値の型情報を得るための演算子として`typeof`があります。
こちらは`typeof`型演算子（Typeof Type Operator）と呼ばれ、`typeof`演算子と区別されています。
https://www.typescriptlang.org/docs/handbook/2/typeof-types.html
```ts
const obj : {
  num: number
  str: string
} = {num: 1, str: 'one'}

// type T = {
//     num: number;
//     str: string;
// }
type T = typeof obj

//const t: "string" | "number" | "bigint" | "boolean" | "symbol" | "undefined" | "object" | "function"
const t = typeof obj
```
このコード例では、型`T`はオブジェクトのプロパティを含めて詳細な型情報を`typeof`型演算子で取得できています。
一方、`typeof`演算子によって`obj`の型に関する文字列を代入されている変数`t`は`typeof`演算子が返しうる文字列のユニオン型であると型推論がされています。
`typeof obj`がどのような文字列を返すかはJavaScriptの`typeof`が実行されるまでわからないため、このような型推論がされているわけですね。
## `typeof`演算子と`typeof`型演算子の見分け方
同じ綴りの演算子があると混乱してしまいそうですが、`typeof`型演算子はリテラル型の`"foo"`や`123`と同様に、型注釈などの型を記述する場面でのみ使用することが可能ですので、どこに記述されているかに着目することで見分けられます。
```ts
const obj = {str: 'foo'}

//const obj2: { str: string; }
const obj2: typeof obj = {str: typeof obj}

console.log(obj2.str) //"object" 
```
上のコード例で出てくる1つ目の`typeof`は型注釈として使用されていますので、型演算子の方の`typeof`であるとわかります。
2つ目の`typeof`については、オブジェクトリテラルに含まれる`str`プロパティの値として記述されていますので、`typeof`演算子の方であるとわかります。
TypeScriptには`typeof`の他にもリテラル型など、JavaScriptでは別の意味をもつが同じ書き方がされる機能がいくつかあります。
どちらの機能なのかわからなくなった時には、記述位置が型が期待される箇所なのか、値が期待される箇所なのかを考えてみると見分けがつくはずです。