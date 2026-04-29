import { Settings as SettingsIcon, Palette } from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="flex flex-col h-full w-full p-6 sm:p-10 overflow-y-auto">
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-xl bg-linear-to-br from-zinc-500/10 to-stone-500/10">
            <SettingsIcon className="h-5 w-5 text-zinc-600 dark:text-zinc-400" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Settings
          </h1>
        </div>
        <p className="text-muted-foreground text-sm sm:text-base mt-1 ml-1">
          Manage your account preferences and profile.
        </p>
      </div>

      {/* Empty state */}
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center space-y-4 max-w-sm">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
            <Palette className="h-7 w-7 text-muted-foreground" />
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-foreground">Settings coming soon</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Account settings and profile customization will be available here.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
