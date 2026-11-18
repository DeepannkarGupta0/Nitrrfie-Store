import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import AccountSettings from "@/components/account/AccountSettings";

export default async function AccountPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  return <AccountSettings />;
}