import Link from "next/link";

export default function Page () {
    return (
        <>
        <Link href='/intercepting-routes/photo/1'><button>photos/1</button></Link>
        <br/>
        <Link href='/intercepting-routes/photo/2'><button>photos/2</button></Link>
        <br/>
        <Link href='/intercepting-routes/photo/3'><button>photos/3</button></Link>
        </>
    )
}