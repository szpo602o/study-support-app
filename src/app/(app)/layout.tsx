import { AppNav } from "@/components/app-nav";
import { signOut } from "@/lib/auth";

export default function AppShellLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  async function signOutAction() {
    "use server";
    await signOut({ redirectTo: "/login" });
  }

  return (
    <>
      <AppNav signOutAction={signOutAction} />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 pb-16">
        {children}
      </main>
    </>
  );
}
