import type { ComponentType } from "react";
import { PageTitle } from "./dhikr-list";
import { useLang } from "@/lib/lang";

export function ComingSoon({ title, sub, icon: Icon }: { title: string; sub: string; icon: ComponentType<{ size?: number }> }) {
  const { t } = useLang();
  return (
    <main className="mx-auto max-w-2xl px-4 pb-10">
      <PageTitle title={title} sub={sub} />
      <div className="rounded-3xl border border-dashed border-border bg-card p-10 text-center shadow-soft">
        <span className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-primary/10 text-primary"><Icon size={32} /></span>
        <p className="mt-5 font-display text-2xl text-foreground">{t("comingSoon")}</p>
        <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">{t("curatedNote")}</p>
      </div>
    </main>
  );
}
