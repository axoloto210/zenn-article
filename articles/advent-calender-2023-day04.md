---
title: "関数型の表現方法をまとめる"
emoji: "🎄"
type: "tech" # tech: 技術記事 / idea: アイデア
topics: [TypeScript, JavaScript, adventcalendar]
published: true
published_at: 2023-12-04 21:00
---
# さまざまな関数型の表現
関数とその型を表現する方法はいくつかありますので、それらをまとめてみたいと思います。
## 関数宣言
`function 関数名(引数:引数の型):返り値の型{処理}`という書き方で関数を宣言する方法です。
関数宣言は**巻き上げ**が起こるため、関数を宣言した位置よりも前で関数を呼び出すことができます。
```ts
console.log(double(5)) //10

function double(num: number): number {
    return num * 2
}
```
## 関数式
`function (引数:引数の型):返り値の型{処理}`という書き方で関数を表します。名前の通り、この書き方をすると式として扱われますので、変数に格納して使用することができます。
関数式については、**巻き上げが起こらない**という点で関数宣言と動作が異なっています。
```ts
console.log(double(5)) //Block-scoped variable 'double' used before its declaration.(2448)

const double = function(num: number): number {
return num * 2
}

console.log(double(5)) //10
```
## アロー関数式
`(引数:引数の型):返り値の型=>{処理}`という構文で表される関数式です。`function`を用いた関数式よりも簡潔に書くことができます。処理の部分が一つの式だけで書ける場合にはさらに簡潔に書くことができて、`(引数:引数の型):返り値の型=>式`のように`{}`と`return`を省略することができます。こちらの記法も**巻き上げは起こりません**。
```ts
console.log(double(5)) //Block-scoped variable 'double' used before its declaration.(2448)

const double = (num: number): number => {
    return 2 * num
}

console.log(double(5)) //10
```
## メソッド記法
オブジェクトリテラルの中で関数を宣言するときに使用できる記法です。
`{関数名(引数:引数の型):返り値の型{処理}}`という構文で表されます。`function`という語を使用しておらず、オブジェクトのプロパティとして関数を呼び出して利用します。
```ts
type T = { name: string; double: (num: number) => number }
const obj: T = {
    name: 'test',
    double(num: number) { return num * 2 }
}

console.log(obj.double(5)) //10
```
## コールシグネチャ
関数にプロパティを持たせた型を表現することができます（オブジェクトのプロパティとして別々に持たせればいいのであまり使用されません）。使用できる箇所はオブジェクト型の中に限定されますが、`{プロパティ:プロパティの型; (引数:引数の型):返り値の型}`のように表すことができます。関数はオブジェクトの一種であるため、関数にプロパティを持たせることができるわけですね。
>JavaScript の関数は、実際にはすべて Function オブジェクトです。

https://developer.mozilla.org/ja/docs/Web/JavaScript/Reference/Global_Objects/Function

```ts
type T = { title?: string; (num: number): number }
const func: T = (num: number) => { return 2 * num }

console.log(func(5)) //10
func.title = 'test'
console.log(func) //(num) => { return 2 * num; } 
console.log({...func})//{ "title": "test"} 
```
上の例から、`(num: number) => { return 2 * num }`は`func`のプロパティではなく、`func`自体の値であることがわかります。
## 返り値の型について
TypeScriptには型推論機能が備わっているため、返り値の型を設定しなかった場合には自動で返り値の型を推論してくれます。
返り値の型を省略する方が簡潔に書けて良いように思えますが、返り値を設定したときとは少し異なる点があり、コンパイルエラーの発生箇所が違ってきます。
関数の処理を誤って記述してしまったときに返り値の型が誤って推論されることとなるため、コンパイルエラーは関数ではなく、その使用箇所で発生してしまいます。
関数の内部でコンパイルエラーを検知できた方が関数内部を読み込む必要もなくなるため可読性が高くなっていいですね。
```ts
const double = (num: number) => {
    return 
    2*num;
}

console.log(double(5)) //undefined 
```
上のコード例はreturnの後に改行が入っていることで`return ;`と捉えられてしまい、`undefined`が返ってきてしまっています。
実際には`2*num;`の箇所に`Unreachable code detected.(7027)`というコンパイルエラーが発生するためこのエラーに気づくことができますが、返り値の型として`number`を明示した場合には追加で`return`の箇所に`Type 'undefined' is not assignable to type 'number'.(2322)`というコンパイルエラーが発生するため、より間違いに気付きやすくなりますね。