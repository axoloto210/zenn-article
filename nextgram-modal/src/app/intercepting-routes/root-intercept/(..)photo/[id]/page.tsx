type Params = {
    id: number
}
//(.)photo/[id]のインターセプトが優先されているため、このページでインターセプトが発生することはないです。
//(.)photo/[id]を削除するとこちらのインターセプトが働くようになります。
export default function InterceptedPhoto({params}:{params:Params}) {
    return <h1>(..) Intercepted Photo {params.id} page</h1>;
  }
  