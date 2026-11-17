
import SignInPageClient from "../SignInPageClient";

export default async function SignInPage({
  searchParams,
}: {
  searchParams?: Promise<{
    redirect?: string;
    redirect_url?: string;
  }>;
}) {
  const params = searchParams ? await searchParams : {};

  const raw = params.redirect_url || params.redirect || "/";

  const safe = /^\/[A-Za-z0-9/_-]*$/.test(raw)
    ? raw
    : "/";

  return <SignInPageClient redirectUrl={safe} />;
}
