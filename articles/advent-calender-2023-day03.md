---
title: "文字列はプリミティブ値なのにlengthプロパティを参照できるわけ"
emoji: "🎄"
type: "tech" # tech: 技術記事 / idea: アイデア
topics: [TypeScript, JavaScript, adventcalendar]
published: true
published_at: 2023-12-03 12:00
---

## 文字列がもつ`length`プロパティ

文字列に含まれる文字数を取得したいとき、`length`プロパティにアクセスすることで取得することができます。

```ts
const str = "foobarbaz";
console.log(str.length); //9
```


文字列はプリミティブな値なので、プロパティを持たないはず。
しかし`length`プロパティを参照できているのは、一時的にオブジェクトが作成されて、そのオブジェクトが持つプロパティを参照しているためです。

> 文字列プリミティブに対してメソッドを呼び出したり、プロパティを参照したりするコンテキストでは、JavaScript は自動的に文字列プリミティブをラップし、ラッパーオブジェクトに対してメソッドを呼び出したり、プロパティを参照したりします。

 https://developer.mozilla.org/ja/docs/Web/JavaScript/Reference/Global_Objects/String

## `length` プロパティと型

文字列が`length`というプロパティを実質的にもっているような記述となるため、TypeScript では`{length: number}`など、Stringのプロパティやメソッドのみをもつ型のオブジェクトに文字列を代入してもコンパイルエラーが発生しないようになっています。

```ts
type T = { length: number; includes: (searchString: string) => boolean };
const obj: T = "foobarbaz"; //コンパイルエラーは発生しない
```
```length```の型がStringオブジェクトの持つ```length```の型と一致しない場合などにはコンパイルエラーを出してくれます。
```ts
type U = { length: string; includes: (searchString: number) => boolean };
const obj2: U = 'foobarbaz' //Type 'string' is not assignable to type 'U'.2322)
```
## `{}`型
文字列が```{length: number}```型のオブジェクトに代入可能であることから、部分型である```{}```型のオブジェクトにも代入可能です。
```ts
const obj:{} = 'foobarbaz' //コンパイルエラーは発生しない
```

`{}`は、`null`と`undefined`以外の値は全て代入可能な型となっています。
```ts
const obj:{} = 234
const obj2:{} = false
const obj3:{} = Symbol
const obj4:{} = undefined  //Type 'undefined' is not assignable to type '{}'.(2322)
const obj5:{} = null       //Type 'null' is not assignable to type '{}'.(2322)

const obj6:{} = Math.random() > 0.5 ? 1 : undefined
//Type 'number | undefined' is not assignable to type '{}'.
//Type 'undefined' is not assignable to type '{}'.(2322)
```

## サロゲートペア文字に注意
`length`プロパティは文字数をあらわしているのではなく、コードユニットの数をあらわしています。
そのため、サロゲートペア文字（𩸽や𠮷）は長さ2としてカウントされてしまいます。（もっと大きな数値でカウントされる文字も存在します👨‍👩‍👧‍👧）
文字列を一度スプレッド構文で配列に入れてから配列の要素数を数えることで、見た目の文字数を数えることができます（スプレッド構文はコードポイントごとに文字列を分けてくれます）。
```ts
const str = '𩸽と𠮷'
console.log(str.length) //5
console.log([...str].length) //3

console.log([...str]) //["𩸽", "と", "𠮷"] 
```

この方法でも絵文字などは直感に反する数値が返ってくるのでご注意を。
```ts
console.log([...'👨‍👩‍👧‍👧']) //["👨", "‍", "👩", "‍", "👧", "‍", "👧"] 
console.log([...'👨‍👩‍👧‍👧'].length) //7
```
4人と数えられるわけでもないんですね。👨👩👧👧