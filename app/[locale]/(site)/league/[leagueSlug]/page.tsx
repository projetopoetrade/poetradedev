import { permanentRedirect, redirect } from "next/navigation";
import { getLeagueBySlug } from "@/sanity/sanity-utils";

export default async function OldLeaguePage(props: { params: Promise<{ leagueSlug: string }> }) {
  const { leagueSlug } = await props.params;
  const league = await getLeagueBySlug(leagueSlug);

  if (!league) {
    redirect("/");
  }

  permanentRedirect(`/games/${league.gameVersion}/league/${leagueSlug}`);
}
