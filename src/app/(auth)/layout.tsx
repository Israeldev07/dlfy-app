export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <main className="flex flex-1 items-start justify-center px-4 py-10 sm:items-center sm:py-16">
      <div className="w-full max-w-[420px]">{children}</div>
    </main>
  );
}
