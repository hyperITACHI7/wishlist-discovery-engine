export default function Nav() {
  return (
    <header className="sticky top-0 z-20 border-b border-line bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        <div className="flex items-center gap-2">
          <span className="text-2xl font-extrabold italic tracking-tight text-brand">
            Wishlist<span className="text-ink">DE</span>
          </span>
          <span className="hidden rounded-full bg-brand-soft px-2 py-0.5 text-[11px] font-semibold uppercase text-brand nav-tab sm:inline">
            Discovery Engine
          </span>
        </div>
        {/* The "How it works" link that used to live here pointed at a
            #how-it-works section pinned below the dashboard. That section
            became its own tab (2026-08-20), so the anchor would now be a dead
            link — and a nav item duplicating a tab is worse than no nav item. */}
        <div className="flex items-center gap-3">
          <span className="hidden items-center gap-1.5 text-[11px] font-semibold uppercase text-mint nav-tab sm:flex">
            <span className="h-1.5 w-1.5 rounded-full bg-mint" />
            Part 1 of the grad-project brief
          </span>
        </div>
      </div>
    </header>
  );
}
