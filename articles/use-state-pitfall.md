---
title: "useStateの落とし穴を避ける"
emoji: "🪄"
type: "tech" # tech: 技術記事 / idea: アイデア
topics: [React, TypeScript, JavaScript]
published: false
---
## コンポーネントに値を紐づける`useState`
React でコンポーネントに値を保持しておきたい時に`useState`というhooks がよく使われます。
この`useState`は通常の変数のように扱うと、思ったように値が更新されなかったり、なぜか値のリセットがかかってしまったりと落とし穴に嵌ってしまうことがしばしばあります。
そんな`useState`がどのような仕組みで値の保持、更新を行っているのかを見ていきたいと思います。
## `useState`とは
`useState`はコンポーネントが保持する値である`state`と、`state`に変更をかけるためのsetter関数を提供します。
```ts
const [num setNum] = useState(0)
```
上のコード例のように`useState`の引数に`state`の初期値を渡して（省略した場合のデフォルト値は`undefined`）呼び出すことで、`state`とsetter関数がタプル型で返されます。（`[state, setState]`部分では配列の分割代入によって値を受け取っています。）
`state`の値を更新するには`setState`に更新したい値を渡します。
`setState`には更新用の関数を渡すこともでき、更新用関数の引数としてその時点での`state`の値を（React側から）受け取ります。
```ts
setNum(((n) => n+1))
```
## なぜ`useState`が必要なのか
`useState`を使用せず、`let`や`const`などによってローカル変数を用意して管理すれば良いようにも思えますが、Reactでは画面内容を更新する際にレンダーとよばれるプロセスを経るため、ローカル変数がレンダー間で保持されずリセットされてしまい、ローカル変数をコンポーネントにうまく紐づけることができません。レンダー間でコンポーネントの値を保持するために`useState`が必要になるわけです。
### そもそもレンダーとは
Reactにおけるレンダーとは、**React がコンポーネントを呼び出すこと**です。
（コンポーネントを呼び出して仮想のDOMツリーを作成し、現在のDOMとの差分を検出してDOMツリーを変更します。）
親コンポーネントからの`props`が変化したときや、`forceUpdate()`がよびだされたとき、`setState`によって`state`が更新されるときなどにレンダーがキューに追加されます。
コンポーネントに値を紐づけるためにコンポーネント内部でローカル変数を宣言しても、レンダー時にコンポーネントが呼び出され、ローカル変数も新たに作成されるためリセットがかかってしまうわけですね。
https://ja.react.dev/learn/render-and-commit
## `useState`で値をセットしてもすぐに更新されない？

@[stackblitz](https://stackblitz.com/edit/stackblitz-starters-wofwch?embed=1&file=src%2FApp.tsx)
上のコード例では、setter関数を２回実行しています。
setter関数をstate変数への値の代入と捉えると、１度目の実行で`num`の値は1となり、2度目の実行で`num`の値は3となるように思えますが、実際にボタンを押してみると2ずつ加算されていきます。
これは、setter関数によってstateの値を変更しているのではなく、次のレンダー時のstateの値を変更する命令をキューに追加することに起因しています。