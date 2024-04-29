import { Inter } from "next/font/google";
import "../globals.css";
import Link from "next/link";
import HardNavigationButton from "./HardNavigationButton";

const inter = Inter({ subsets: ["latin"] });

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
    <html lang="en">
      <body className={inter.className}>
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
      </body>
    </html>
  );
}
