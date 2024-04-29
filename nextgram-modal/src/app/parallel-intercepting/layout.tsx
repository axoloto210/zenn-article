export default function ParallelInterceptingLayout({
  children,
  auth,
}: Readonly<{
  children: React.ReactNode;
  auth: React.ReactNode;
}>) {
  return (
    <>
      {children}
      {auth}
    </>
  );
}
