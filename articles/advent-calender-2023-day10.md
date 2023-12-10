---
title: "あらゆる型の部分型、never型とは"
emoji: "🎄"
type: "tech" # tech: 技術記事 / idea: アイデア
topics: [TypeScript, JavaScript, adventcalendar]
published: true
published_at: 2023-12-10 21:00
---
## `never`型とは
`never`型は、「決して観測されない値」、「該当する値が存在しない」ことを表す型です。
`never`型の変数には`any`型の値であっても代入することはできません。
```ts
const anyValue: any = 271
const neverValue: never = anyValue //Type 'any' is not assignable to type 'never'.(2322)
```

`never`型の変数を引数に設定した場合には渡せる引数が存在しないため^[型アサーション`as never`などで型安全性を破壊すればその限りではないですが。]、関数を呼び出すことができなくなります。
```ts
function neverArgFunction(arg: never){
    return 314
}

const num = neverArgFunction(1) //Argument of type 'number' is not assignable to parameter of type 'never'.(2345)
const numAsNever = neverArgFunction(1 as never) //型アサーションによってコンパイルエラーを握りつぶすことはできます。
console.log(numAsNever) //314 
```
## `never`型はあらゆる型の部分型
型注釈や型アサーションによって`never`型の変数を用意した場合に、この`never`型の変数は、あらゆる型の変数に代入することが可能です。
このことから、`never`型があらゆる型の部分型として扱われていることがわかります。
```ts
const neverValue: never = 1 as never
const str: string =  neverValue
const obj:{str: string, num: number} = neverValue

function neverArgFunction(arg: never){
    const num: number = arg
    const obj: {str: string, num: number} = arg
    return 314
}
// コンパイルエラーが発生しない
```

## `never`型とユニオン型
`number | never`のような`never`とのユニオン型については、`never`の部分が無視された形の型となります。
```ts
type UnionNever = string | number | never

const num: UnionNever = 1
```
型注釈`:UnionNever`をつけてVS Codeなどでカーソルを合わせてみると、`type UnionNever = string | number`のように`never`部分が無視されて表示されます。

また、`never`型は、ユニオン型の変数について型情報で条件分岐させていったときに、ユニオンのすべての型の分岐が出尽くした後の変数の型として出現します。
以下のコードでは`typeof`による条件分岐によって、最後のブロックの`arg`には`string`型の値も`number`型の値もあてはまらないこととなります。
引数は`string`型か`number`型であると型注釈が付けられていますので、最後のブロックの`arg`は存在し得ない値、つまり`never`型が割り当てられることになります。
```ts
function fn(arg: string | number) {
  if (typeof arg === "string") {
    console.log(arg) //(parameter) arg: string
  } else if (typeof arg === "number") {
    console.log(arg) //(parameter) arg: number
  } else {
    console.log(arg) //(parameter) arg: never
  }
}
```
## `never`型を返す関数
常に例外を投げるなど、値を返さない関数の返り値の型として`never`を使用できます。
例外を投げる関数の返り値を取得することは不可能なため、存在しない値が返ってくるとみなせて、`never`型を設定してもコンパイルエラーが起きないわけですね。
```ts
function throwError(): never {
  throw new Error();
}
const neverValue:never = throwError() //コンパイルエラーは発生しない。
```
上のコードでは`throwError`の返り値に`never`型の型注釈をつけなかった場合には`void`型が返ってくると型推論されてしまい、代入部分でコンパイルエラーが発生します。
```Type 'void' is not assignable to type 'never'.(2322)```

また、`never`型を返り値とする関数は、ブロックの最後まで到達できないように記述されている必要があります。ブロックの最後まで到達する可能性がある場合にはコンパイルエラーが出るようになっています。
```ts
function throwError(str: string):never {
    if(str.length < 20){
        throw new Error(str)
    }
}
//A function returning 'never' cannot have a reachable end point.(2534)
```


`never`についての公式Docsはこちら↓
https://www.typescriptlang.org/docs/handbook/2/functions.html#never