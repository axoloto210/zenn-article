type Params = {
id: number
}

export default function Page ({params}:{params:Params}) {
console.log(params)
    return (
        <div>Not Interceptted</div>
    )
}