---
title: "inferとはなにものか？Zodを添えて"
emoji: "🥂"
type: "tech" # tech: 技術記事 / idea: アイデア
topics: [TypeScript, JavaScript, adventcalendar]
published: true
---
## `infer`とは型推論によって決まる、一時的な型変数の宣言
ユーティリティ型の実装やZodでよくみかける`infer`とは一体何者なのかをみていきます。
```ts
// ユーティリティ型のひとつ、ReturnType型の実装
type ReturnType<T extends (...args: any) => any> = T extends (...args: any) => infer R ? R : any;
```
先に結論から、**`infer`とはConditional Types でのみ使用される一時的な型変数**（の宣言）のことです。
変数ではありますが、実装側で明示的に型を変数に渡すのではなく、コンパイラが変数の型を推論(infer)して型変数の中身を決定します。このことがvariable などの語ではなくinfer が使用されている理由なのでしょう。
`infer`を使用することで、より動的な型付けを実現することができます。

## Conditional Types
`infer`を知るために、Conditional Types についても少しみてみたいと思います。
Conditional Types は**型の条件分岐**を行える機能で、`T extends U ? A : B`という構文で表されます。三項演算子と同様に、`T`型が`U`型の部分型であれば`A`型に、そうでなければ`B`型になります。
```ts
type IsString<T> = T extends string ? true : false

//type NumIsString = false
type NumIsString = IsString<number>

//type LiteralIsString = true
type LiteralIsString = IsString<'str'>
```
このコード例の`isString`型では、型引数`T`に`string`型の部分型が与えられた場合には`true`型が返され、それ以外の場合には`false`型が返されています。

## `infer`はtrue側の分岐内でしか使用できない
`infer`はConditional Types `T extends U ? A : B`の`U`の部分で宣言します。`T`として渡した型が`T extends U`をみたすとき、`T`型の構造の中で、`U`内で宣言した`infer`部分に対応する箇所が型変数の中身として推論され、true側の分岐へと渡されます。
```ts
type FlattenArray<T> = T extends (infer InferredType)[] ?  InferredType : never;

type A = FlattenArray<number[]>
//type A = number
type B = FlattenArray<string>
//type B = never
```
このコード例では`T`が`(infer InferredType)[]`の部分型であること、つまり何らかの配列型であるとき、`infer`が働きます。
`T`が`number[]`の場合には、`(infer InferredType)[]`の`(infer InferredType)`部分に対応する箇所は`number`型です。よって、`InferredType`は`number`型であると型推論されてtrue側の分岐へ渡されています。

`infer`で宣言した型は、false側の分岐で使用することはできません。これは`T extends U`を満たさない場合には`T`と`U`の構造が異なる可能性があり、`infer`で宣言した型の推論がうまくできない場合があるためですね。
```ts
//後半のInferredType部分でコンパイルエラーが発生します。
//Cannot find name 'InferredType'.(2304)
type ErrorInfer<T> = T extends (infer InferredType)[] ? never : InferredType;
```
`T extends U`を満たすことは、`U`内で`infer`による型推論ができることを保証する条件になっていたわけですね。^[TypeScript の型推論は必ずしも正しい型を推論できるわけではないことには依然注意が必要です。]
## 複数の`infer`
`infer`による一時的な型変数の作成は、単一である必要はなく、複数個作成することも可能です。
```ts
type ReverseFunction<T extends (arg: any) => any> = T extends (arg: infer U) => infer V
    ? (arg: V) => U
    : never

type Reverse = ReverseFunction<(num: number) => string>
//type Reverse = (arg: string) => number
```
上のコードでは型引数に「引数が1つの関数型」という制約を課しています。
この形の型が型引数として渡された際に、`T extends (arg: infer U) => infer V`の部分から、`U`が渡された関数型の引数部分の型、`V`が返り値部分の型として推論されます。
その後、`(arg: V) => U`という元の関数型と比べて引数と返り値の型が逆になった型が返されています。
## `infer`が使われているユーティリティ型
TypeScriptに標準で組み込まれている型であるユーティリティ型のうち、`Parameters`型や`ReturnType`型、`Awaited`型などの実装には`infer`が使用されています。以下の記事でも触れていますので、興味があれば実装を確認してみてください。
https://zenn.dev/axoloto210/articles/advent-calender-2023-day24

## Zodのinferはなにもの？
Next.js のチュートリアルにも登場するバリデーションライブラリ、Zodにも型を推論する機能として`z.infer<T>`というものがあります。
https://zod.dev/
```ts
import { z } from "zod";

const testSchema = z.object({
    num: z.number()
})

type TestSchemaType = typeof testSchema
// type TestSchemaType = z.ZodObject<{
//     num: z.ZodNumber;
// }, "strip", z.ZodTypeAny, {
//     num: number;
// }, {
//     num: number;
// }>


type TestType = z.infer<TestSchemaType>
// type TestType = {
//     num: number;
// }
```
Schema の型を`z.infer<T>`に渡すことで、Schema に対応した型を取得しています。この`z.infer`は`infer`と関係があるのでしょうか？
`z.infer`の部分の型をVSCodeなどで見てみると、以下のようになっています。
```ts
(alias) type infer<T extends ZodType<any, any, any>> = T["_output"]
export infer
```
また、Zodの`z.infer`の実装は以下のようになっています。
```ts:zod/lib/type.d.ts
export declare type ZodTypeAny = ZodType<any, any, any>;
export declare type TypeOf<T extends ZodType<any, any, any>> = T["_output"];
export declare type input<T extends ZodType<any, any, any>> = T["_input"];
export declare type output<T extends ZodType<any, any, any>> = T["_output"];
export type { TypeOf as infer };
```

https://github.com/colinhacks/zod/blob/master/src/types.ts#L49-L53

`export type { TypeOf as infer }`の部分からも分かる通り、`z.infer`の`infer`は`TypeOf`の別名となっています。
`z.TypeOf`としても全く同じ挙動をしますね。
```ts
import { z } from "zod";

const testSchema = z.object({
    num: z.number()
})
type TestSchemaType = typeof testSchema
// type TestSchemaType = z.ZodObject<{
//     num: z.ZodNumber;
// }, "strip", z.ZodTypeAny, {
//     num: number;
// }, {
//     num: number;
// }>


type TestType = z.TypeOf<TestSchemaType>
// type TestType = {
//     num: number;
// }
```
Zodに登場する`infer`も一時的な型変数を宣言する`infer`が関連しているのではないかと思いましたが、Zodの方の`infer`は型推論の意味で名付けられていただけのようですね。