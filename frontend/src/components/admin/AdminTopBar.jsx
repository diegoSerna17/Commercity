import { IconSettings } from "./AdminIcons";

export default function AdminTopBar() {
  return (
    <header className="h-14 flex items-center px-4 fixed top-0 left-0 right-0 z-30 bg-auth-card-bg border-b border-figma-divider">
      <span className="font-sans font-bold text-2xl tracking-tight text-brand-orange">
        CommerCity
      </span>

      <div className="ml-auto">
        <button className="p-1 transition-colors rounded-lg text-brand-muted-text hover:text-on-surface">
          <IconSettings size={22} />
        </button>
      </div>
    </header>
  );
}