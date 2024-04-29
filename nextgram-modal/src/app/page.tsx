import Link from "next/link";

export default function Page () {
    return (
        <>
        <div>Top Page</div>
        <Link href='/parallel-routes'><button>Parallel Routes</button></Link>
        <Link href='/intercepting-routes'><button>Intercepting Routes</button></Link>
        </>
    )
}