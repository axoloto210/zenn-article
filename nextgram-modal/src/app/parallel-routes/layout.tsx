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
