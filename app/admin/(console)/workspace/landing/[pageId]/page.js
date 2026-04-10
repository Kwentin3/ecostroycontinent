import { redirect } from "next/navigation";

export default async function LandingWorkspacePage({ params }) {
  const { pageId } = await params;

  redirect(`/admin/entities/page/${pageId}`);
}
