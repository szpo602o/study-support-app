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
      <main
        className="mx-auto w-full flex-1 px-[var(--page-pad-x)] pt-[var(--page-pad-y)]"
        style={{
          maxWidth: "var(--content-max)",
          paddingBottom: "calc(var(--nav-h) + env(safe-area-inset-bottom) + 24px)",
        }}
      >
        {children}
      </main>
    </>
  );
}
