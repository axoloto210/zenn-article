import Link from "next/link";

export default function Page () {
    return (
        <>
        <div>Top Page</div>
        <Link href='/parallel-routes'><button>Parallel Routes</button></Link>
        <br/>
        <Link href='/intercepting-routes'><button>Intercepting Routes</button></Link>
        <br/>
        <Link href='/parallel-intercepting'><button>Modal</button></Link>
        </>
    )
}