"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, Calendar, Tv2 } from "lucide-react";
import LeaguePortableText from "./LeaguePortableText";
import type { SanityGggPost } from "@/sanity/sanity-utils";

interface PreLaunchSectionProps {
  prelaunchTeaser?: any[];
  prelaunchMediaUrls?: string[];
  gggPosts?: SanityGggPost[];
  locale: string;
  labels: {
    whatWeKnowSoFar: string;
    gggOfficialPosts: string;
    teaserMedia: string;
    viewOfficialPost: string;
  };
}

function formatDate(dateStr: string, locale: string): string {
  try {
    return new Intl.DateTimeFormat(locale === "pt-br" ? "pt-BR" : "en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(new Date(dateStr));
  } catch {
    return dateStr;
  }
}

function getYouTubeId(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtube.com") && u.pathname.includes("/embed/")) {
      return u.pathname.replace("/embed/", "").split("/")[0];
    }
    if (u.hostname.includes("youtu.be")) {
      return u.pathname.replace("/", "").split("?")[0];
    }
    if (u.hostname.includes("youtube.com")) {
      return u.searchParams.get("v");
    }
  } catch {
    // fallback
  }
  return null;
}

export default function PreLaunchSection({
  prelaunchTeaser,
  prelaunchMediaUrls,
  gggPosts,
  locale,
  labels,
}: PreLaunchSectionProps) {
  const hasTeaser = prelaunchTeaser && prelaunchTeaser.length > 0;
  const hasMedia = prelaunchMediaUrls && prelaunchMediaUrls.length > 0;
  const hasPosts = gggPosts && gggPosts.length > 0;

  if (!hasTeaser && !hasMedia && !hasPosts) return null;

  return (
    <div className="space-y-12">
      {/* What We Know So Far */}
      {hasTeaser && (
        <section className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-bold mb-6 text-foreground">
              {labels.whatWeKnowSoFar}
            </h2>
            <div className="bg-muted/30 rounded-xl p-6 border border-border">
              <LeaguePortableText content={prelaunchTeaser!} />
            </div>
          </div>
        </section>
      )}

      {/* Teaser Media */}
      {hasMedia && (
        <section className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-bold mb-6 flex items-center gap-3 text-foreground">
              <Tv2 className="w-7 h-7 text-primary" />
              {labels.teaserMedia}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {prelaunchMediaUrls!.map((url, index) => {
                const videoId = getYouTubeId(url);
                const embedUrl = videoId
                  ? `https://www.youtube.com/embed/${videoId}`
                  : url;
                return (
                  <div
                    key={index}
                    className="aspect-video rounded-xl overflow-hidden border border-border shadow-lg"
                  >
                    <iframe
                      src={embedUrl}
                      title={`League teaser ${index + 1}`}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      className="w-full h-full"
                    />
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* GGG Official Posts */}
      {hasPosts && (
        <section className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-bold mb-6 text-foreground">
              {labels.gggOfficialPosts}
            </h2>
            <div className="space-y-4">
              {gggPosts!.map((post, index) => (
                <Card key={index} className="hover:shadow-md transition-shadow border-border">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-4">
                      <CardTitle className="text-lg leading-tight">
                        {post.title}
                      </CardTitle>
                      <Badge variant="outline" className="shrink-0">GGG</Badge>
                    </div>
                    {post.date && (
                      <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {formatDate(post.date, locale)}
                      </p>
                    )}
                  </CardHeader>
                  {(post.summary || post.url) && (
                    <CardContent className="pt-0">
                      {post.summary && (
                        <p className="text-sm text-muted-foreground mb-3">{post.summary}</p>
                      )}
                      {post.url && (
                        <a
                          href={post.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 text-sm text-primary hover:text-primary/80 font-medium transition-colors"
                        >
                          <ExternalLink className="w-4 h-4" />
                          {labels.viewOfficialPost}
                        </a>
                      )}
                    </CardContent>
                  )}
                </Card>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
