type Params = {
    id: number
}

export default function InterceptingPage (params: {params: Params}) {
    return (
        <div>Intercept!!</div>
    )
}