import { Link } from "@tanstack/react-router";
import { Bell, HardDrive, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SHOW_ONBOARDING_EVENT, useLocationPermission, type LocationState } from "@/lib/permissions";

const LABEL: Record<LocationState, string> = {
  granted: "Allowed",
  prompt: "Not asked yet",
  denied: "Blocked",
  unsupported: "Not available on this device",
};

export function PermissionsPrivacy() {
  const [loc] = useLocationPermission();
  return (
    <section aria-labelledby="perm-title" className="mt-8">
      <h2 id="perm-title" className="font-semibold text-foreground">Permissions and privacy</h2>
      <p className="mb-4 mt-1 text-sm text-muted-foreground">Nothing here is required to read the Quran or use offline features.</p>
      <ul className="space-y-3">
        <Row icon={<MapPin size={18} />} title="Location" status={loc ? LABEL[loc] : "Checking…"}>
          Used only to calculate prayer times where you are. Never uploaded. Works without it — pick your city by hand.
          {loc === "denied" && <span className="mt-2 block text-foreground">To allow it again, open Android Settings → Apps → My Quran → Permissions → Location.</span>}
          {loc !== "denied" && loc !== "unsupported" && <Link to="/ramadan" className="mt-2 block font-semibold text-primary">Go to Prayer times</Link>}
        </Row>
        <Row icon={<Bell size={18} />} title="Notifications" status="Not used">
          The app sends no notifications, so it never asks for this permission.
        </Row>
        <Row icon={<HardDrive size={18} />} title="Storage" status="No permission needed">
          Downloaded recitations are kept in the app's private storage and removed if you uninstall the app.
        </Row>
      </ul>
      <Button variant="outline" className="mt-4 min-h-11 w-full" onClick={() => window.dispatchEvent(new Event(SHOW_ONBOARDING_EVENT))}>
        Show welcome tour again
      </Button>
    </section>
  );
}

function Row({ icon, title, status, children }: { icon: React.ReactNode; title: string; status: string; children: React.ReactNode }) {
  return (
    <li className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-2 font-semibold text-foreground"><span className="text-primary" aria-hidden>{icon}</span>{title}</span>
        <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs text-muted-foreground">{status}</span>
      </div>
      <p className="mt-2 text-sm text-muted-foreground">{children}</p>
    </li>
  );
}
