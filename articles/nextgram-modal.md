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

## NextGramのModal実装
### ディレクトリ構成
### createPortal
### <dialog>