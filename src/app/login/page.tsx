import { AuthError } from "next-auth";
import { redirect } from "next/navigation";
import { signIn } from "@/lib/auth";

export default function LoginPage() {
  async function loginAction(formData: FormData) {
    "use server";
    try {
      await signIn("credentials", {
        password: String(formData.get("password") ?? ""),
        redirectTo: "/",
      });
    } catch (error) {
      if (error instanceof AuthError) {
        redirect("/login?error=1");
      }
      throw error;
    }
  }

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center px-4 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-medium text-[var(--ink)]">学習継続</h1>
        <p className="mt-3 text-sm leading-relaxed text-[var(--muted)]">
          決めた目標に対して、毎日の学習を簡単に記録します。
        </p>
      </div>
      <form action={loginAction} className="space-y-4">
        <label className="block space-y-2">
          <span className="text-sm text-[var(--muted)]">パスワード</span>
          <input
            type="password"
            name="password"
            required
            autoComplete="current-password"
            className="w-full rounded-lg border border-[var(--line)] bg-[var(--paper)] px-3 py-3 text-base"
          />
        </label>
        <button
          type="submit"
          className="w-full rounded-lg bg-[var(--ink)] px-4 py-3 text-base text-[var(--paper)]"
        >
          入る
        </button>
      </form>
    </div>
  );
}
