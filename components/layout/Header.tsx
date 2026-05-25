"use client";

import { TopHeadlineBar } from "./TopHeadlineBar";
import { MainNavHeader } from "./MainNavHeader";

export function Header() {
  return (
    <div className="shrink-0">
      <TopHeadlineBar />
      <MainNavHeader />
    </div>
  );
}