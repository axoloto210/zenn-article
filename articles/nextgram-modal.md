---
title: "公式実装例NextGramを参考にAppRouterでModalを実装しよう"
emoji: "📸"
type: "tech" # tech: 技術記事 / idea: アイデア
topics: [nextjs,approuter,react,typescript]
published: false
---
## NextGram
Next.js の公式が出している実装例の1つにNextGramというものがあります。
本記事ではこちらの実装例と関連するApp Routerの機能であるParallel RoutesやIntercepting Routesについてみていきたいと思います。

https://nextgram.vercel.app/

https://github.com/vercel/nextgram

### App RouterのModal
NextGram は、App RouterのParallel RoutesとIntercepting Routesを組み合わせてModalを表示する公式のサンプルアプリです。
このアプリで実装されているModalは、以下に挙げるような従来のModal実装方法の懸念点が解消されたものとなっています。
- Modalに表示されているコンテンツがURLで共有できない
- ページがブラウザのリロードなどで更新された際にModalの内容が消えてしまう
- ブラウザの戻る/進むでModalが消える/現れるのではなくページごと遷移してしまう

これらの懸念点を解消した実装は、Modal内にコンテンツを表示するのか、Modalを使用せずにそのまま表示するのかを画面遷移の方法に応じて切り替えられることによって実現されています。
画面遷移の方法によって、表示内容を切り替えるために用いられているルーティング方法が、**Parallel Routes**と**Intercepting Routes**です。
Modalの実装をみていく前に、画面遷移の種類とこれらのルーティング方法について確認したいと思います。

## 画面遷移の種類
画面遷移の種類にはハードナビゲーションとソフトナビゲーションがあります。
https://nextjs.org/docs/app/building-your-application/routing/linking-and-navigating#5-soft-navigation
### ハードナビゲーション
ハードナビゲーションは、ブラウザによる再読み込みを伴うページ遷移のことで、ブラウザの更新ボタンによる再読み込みや`window.location.href`による画面遷移などが該当します。
### ソフトナビゲーション
ソフトナビゲーションは、SPAならではの画面遷移で、Next.jsの`<Link>`コンポーネントによる画面遷移や`useRouter`の`push()`などによる画面遷移が該当します。
ブラウザによるページ全体の再読み込みを伴わず、必要な箇所のみ再レンダリングされるため、高速で快適なユーザー体験をもたらします。

## Parallel Routes
Parallel Routeを使用すると、複数のrouteにあるpage.tsxを（同じlayout.tsxを使用して）1つのページに同時にレンダリングできます。
もちろん描画するpage.tsxは1つでもよく、条件によってレンダリングするかどうかをそれぞれ決めることもできます。
Parallel Routesを使用するには、ファイル構成に「slots」を導入する必要があります。

https://nextjs.org/docs/app/building-your-application/routing/parallel-routes

### slots
Parallel Routes を使用することはslotsによって宣言できます。
slotsは`@folder`の形式で表され、slotsに含まれる"page"は親のlayoutにpropsのように渡されます。
親のlayoutには元々`children`が渡されますが、これとは並行して`folder`が渡されるようになります。`children`自体も暗黙的にslots(`@children`)であるとみなせます。
```ts:layout.tsx
export default function Layout({
  folder,
  children,
}: Readonly<{
  folder: React.ReactNode;
  children: React.ReactNode;
}>) {
  return (
    <>
        <section>{children}</section>
        <section>{folder}</section>
    </>
  );
}

```

**slotsはURLの構造に影響を与えません。**
Parallel Routes では、その名の通り複数のページが**並行**してレンダリングされます。
slotsはURLに影響を与えないため、同じルート（URL）に対して複数のページが該当することになります。このことによって、並行した複数ページのレンダリングが実現できるわけですね。

### active state
Next.jsは各slotについて、**active state**と呼ばれる「表示・非表示状態」を追跡します。
active stateとは、slot に属するpageが表示されていたかどうかの状態を表すもので、pageが表示されていた状態で別の階層へソフトナビゲーションが起こった場合には、そのURLに対応するページが存在しない場合でも、遷移前に表示していたpageを表示し続けます。
つまり、各slot について、どのpageがアクティブだったか（表示されていたか）を追跡しており、これが各slotの**active state**と呼ばれるものになります。
ただし、ブラウザリロードなどのハードナビゲーションが起こると、active stateが把握できなくなるため、対応するpageが存在しないURLの場合には、そのslotについては代わりに`default.tsx`の内容が表示されます。
何も表示したくない場合には、`null`を返すようにしておきます（`default.tsx`を用意しないとエラーページが表示されてしまいます）。
```tsx:default.tsx
export default function Default(){
    return null
}
```

### ナビゲーション方法によるコンテンツの表示切り替え
Parallel Routesでは、ナビゲーションの種類によって表示内容が切り替えられます。
例えば、以下のようなslotsのディレクトリ構造があるとします。
```
app
└── parallel-routes
    ├── @teams
    │   ├── settings
    │   │    └── page.tsx
    │   └── default.tsx
    │ 
    ├── @analytics
    │   ├── default.tsx
    │   └── page.tsx
    ├── default.tsx
    ├── layout.tsx
    └── page.tsx
```
teams, analytics, children slot のpage は以下のようにlayoutで受け取って表示できます。
```tsx:layout.tsx
import "../globals.css";
import Link from "next/link";
import HardNavigationButton from "./HardNavigationButton";

export default function Layout({
  teams,
  analytics,
  children,
}: Readonly<{
  teams: React.ReactNode;
  analytics: React.ReactNode;
  children: React.ReactNode;
}>) {
  return (
    <>
        <Link href="/parallel-routes">
          <button className="m-4 bg-blue-400">soft navigete to root</button>
        </Link>
        <br />
        <Link href="/parallel-routes/settings">
          <button className="m-4 bg-blue-400">soft navigate to settings</button>
        </Link>
        <br />
        <HardNavigationButton />

        <section className="m-4">{children}</section>
        <section className="m-4">{teams}</section>
        <section className="m-4">{analytics}</section>
    </>
  );
}

```
<br/>
下のgif画像では`/parallel-routes`から`/parallel-routes/settings`へソフトナビゲーションで遷移した後で再び`/parallel-routes`へ遷移しています。
![](/images/nextgram-modal/parallel-route.gif)


`/parallel-routes`へアクセスした時、layoutには`children`, `teams`, `analytics`が渡されるわけですが、teams slotには`/parallel-routes`に対応するページがないため、`@teams/default.tsx`の内容が表示されます。
children とanalytics のpage 内容については、どちらも表示されます（紫色の箇所）。

ここで、`/parallel-routes/settings` へソフトナビゲーションが起こると、teams slot については`@teams/page.tsx` の内容が表示されますが、対応するページがないはずのanalytics slot, children slotについても、`/parallel-routes`で表示されていた内容が**そのまま表示され続けます**。
`@analytics`, `@children`についてはソフトナビゲーションによる遷移前に**コンテンツが表示されていた**ということを**active state**としてNext.js が追跡・把握できているために、そのまま表示するという判断ができているわけですね。

再び`/parallel-routes`へソフトナビゲーションが起こると、初めの表示とは異なり`@teams/default.tsx`ではなく`@teams/settings/page.tsx`の内容が引き続き表示されています。



今度はこの状態でブラウザリロードを行ってみると、teams slot については`default.tsx`の内容が再び表示されることとなります。
ハードナビゲーションではNext.js が**active state**を追跡できず、何を表示すべきか判断がつかないため、デフォルトのコンテンツが表示されるわけですね。

![](/images/nextgram-modal/parallel-route-2.gif)

`/parallel-routes/settings`でブラウザリロードを行った場合にも、URLに対応するpageをもたないslot では`default.tsx`の内容が表示されます。
<br/>
gifで使用しているコードは以下のものです。
https://github.com/axoloto210/zenn-article/tree/main/nextgram-modal

## Intercepting Routes
Parallel Routes では並行して複数のpageが描画されていましたが、Intercepting Routesでは同じroute（URL）にある別のpageの描画を阻止（インターセプト）して、pageが描画されます。
画面描画のインターセプトが発生する条件は、ソフトナビゲーションによる画面遷移で該当ページが表示されることです。
https://nextjs.org/docs/app/building-your-application/routing/intercepting-routes
### Intercepting Routesの定義方法
Intercepting Routesは`(..)folder`というようなディレクトリ名とすることによって定義します。
相対パスの`../`のようにどのroute のpage をインターセプトするかを指定できます。
- `(.)` 同じ階層
- `(..)` 1つ上の階層
- `(..)(..)` 2つ上の階層
- `(...)` `app`ディレクトリのある階層

**この記法もURLには影響を与えません。**（route segment とならない）
`(..)`は1つ上の階層を指定しますが、これはファイルの構成による階層を指すのではなく、**route segment**単位での階層を指します。
以下のようなファイル構造となっていた場合、slotである`@modal`が**route segment** とならないことから、`(..)photos`の`(..)`は、`feed`と同じ階層を指します。
ファイルの構成上は、`feed`ディレクトリは`(..)photos`の2つ上の階層となっていることには注意が必要です。
```
.
└── app
    ├── feed
    │   └── @modal
    │       └── (..)photos
    └── photos
```

(執筆時点では公式Docsに記載がないようですが、`(...)`などを使用して階層が上のディレクトリを指定してインターセプトする場合、`(...)`を記載したディレクトリ以下の階層にあるLinkコンポーネントや`useRouter`の`push()`でしかインターセプトが発生しないようになっているようです。)


## NextGramのModal実装
ここからは公式実装例**NextGram**でModalがどのように実装されているかをみていきます。
### ディレクトリ構成
NextGram はParallel Routes とIntercepting Routes を組み合わせた以下のディレクトリ構成でModal表示を実現しています。
ソフトナビゲーションの場合にはModalが表示され、共有したURLから直接アクセスしたり、ブラウザリロードなどのハードナビゲーションによってページを表示した場合にはModalが表示されず、Modal内に表示されるはずだったコンテンツが表示されます。
```
.
└── app
    ├── @modal
    │   ├── (.)photos
    │   │   └── [id]
    │   │       ├── modal.tsx
    │   │       └── page.tsx
    │   └── default.tsx
    ├── photos
    │   └── [id]
    │       └── page.tsx
    ├── default.tsx
    ├── layout.tsx
    └── page.tsx
```
`@modal/(.)photos`の箇所でParallel Routes とIntercepting Routes が併用されています。
`/photos/1`などにソフトナビゲーションによるアクセスがあった場合には、`(.)photos/[id]`による画面描画のインターセプトが働くため、`/photos/[id]/page.tsx`の内容は表示されず、代わりに`@modal/(.)photos/[id]/page.tsx`の内容がModal内に表示されます。
一方、ハードナビゲーションによるアクセスが行われた場合にはインターセプトは働かず、`photos/[id]/page.tsx`の内容が表示されます。
以上のような挙動により、URL共有によってModal内のコンテンツ（`photos/[id]/page.tsx`に対応）を共有したり、ブラウザリロードによってModal内のコンテンツが消えてしまうことを防ぐことが可能となります（これらを実現するには、modal slot での表示内容とchildren slot での表示内容を揃えておく必要はあります）。
<br/>
`layout.tsx`にはModal表示用のdiv 要素が配置されており、他の箇所で作成されたModal用のJSX要素をReact の`createPortal`によってdiv 要素に転送する形で実装されています。
```tsx:layout.tsx
export default function RootLayout(props: {
  children: React.ReactNode;
  modal: React.ReactNode;
}) {
  return (
    <html>
      <body>
        {props.children}
        {props.modal}
        <div id="modal-root" />
      </body>
    </html>
  );
}
```
### createPortal
`createPortal`を利用することで、DOM 上の別の場所に子要素（`children`）をレンダーすることができるようになります。

`createPortal(children, domNode, key?)`
引数に、描画したい子要素`children`と描画先のDOMノード`domNode`を渡すことで、`domNode`の下に`children`を描画したReactノードが返されます。
`domNode`として実際に渡す要素は、`document.getElementById()` によって取得します。
この要素はレンダー済みである必要があり、更新中の場合にはポータルが再生成されます。

イベントの伝播には注意が必要で、DOMツリーに従って伝播されるのではなく、Reactツリーに従って伝播されます。`createPortal`は引数として受け取った子要素の物理的な位置のみを変更しているわけです。
`createPortal`という名前から、JSX要素をワープさせるためのポータルを作成していると捉えることができますね。

https://ja.react.dev/reference/react-dom/createPortal
### Modalコンポーネント
```tsx:@modal/(.)photos/[id]/modal.tsx
'use client';

import { type ElementRef, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createPortal } from 'react-dom';

export function Modal({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const dialogRef = useRef<ElementRef<'dialog'>>(null);

  useEffect(() => {
    if (!dialogRef.current?.open) {
      dialogRef.current?.showModal();
    }
  }, []);

  function onDismiss() {
    router.back();
  }

  return createPortal(
    <div className="modal-backdrop">
      <dialog ref={dialogRef} className="modal" onClose={onDismiss}>
        {children}
        <button onClick={onDismiss} className="close-button" />
      </dialog>
    </div>,
    document.getElementById('modal-root')!
  );
}
```
NextGram のModalコンポーネントは\<dialog> を使用して実装されています。
`showModal()`によってdialogを開いた状態にできますが、コンポーネントが描画された後に`useEffect`内の処理によってModalを開いた状態にしています。

