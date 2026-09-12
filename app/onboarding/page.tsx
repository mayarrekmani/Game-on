import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import OnboardingForm from "@/components/OnboardingForm";

export default async function OnboardingPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("onboarded, display_name")
    .eq("id", user.id)
    .single();

  if (profile?.onboarded) redirect("/");

  return (
    <main className="flex min-h-[85vh] items-center justify-center">
      <div className="w-full max-w-md">
        <h1 className="mb-1 font-serif text-2xl font-extrabold">Set up your profile</h1>
        <p className="mb-6 text-sm text-slate-500">
          First time signing in — pick how you&apos;ll show up to your groups.
        </p>
        <OnboardingForm userId={user.id} initialName={profile?.display_name ?? ""} />
      </div>
    </main>
  );
}
