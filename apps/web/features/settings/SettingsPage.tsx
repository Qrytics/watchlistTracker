/**
 * features/settings/SettingsPage.tsx
 *
 * User preferences:
 *  - Notification channel toggles (push / email / digest)
 *  - Alert type toggles
 *  - Location (lat/lng + radius)
 *  - Account info (display name)
 */

"use client";

import { useState, useEffect } from "react";
import useSWR from "swr";
import { Button, Card, Spinner } from "@watchlist/ui";
import type { UserPreferenceSummary, LocationSummary } from "@watchlist/types";

const fetcher = (url: string) => fetch(url).then((r) => r.json()).then((d) => d.data);

export function SettingsPage() {
  const { data, isLoading, mutate } = useSWR("/api/settings", fetcher);

  const [pref, setPref] = useState<Partial<UserPreferenceSummary>>({});
  const [loc, setLoc] = useState<Partial<LocationSummary>>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [detecting, setDetecting] = useState(false);

  useEffect(() => {
    if (data) {
      setPref(data.preference ?? {});
      setLoc(data.location ?? {});
    }
  }, [data]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ preference: pref, location: loc }),
    });
    setSaving(false);
    setSaved(true);
    mutate();
    setTimeout(() => setSaved(false), 2500);
  }

  function detectLocation() {
    setDetecting(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLoc((l) => ({
          ...l,
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        }));
        setDetecting(false);
      },
      () => {
        setDetecting(false);
        alert("Could not detect location. Please enter it manually.");
      }
    );
  }

  function toggle(key: keyof UserPreferenceSummary) {
    setPref((p) => ({ ...p, [key]: !p[key] }));
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSave} className="space-y-6">
      <h1 className="text-xl font-bold text-gray-900">Settings</h1>

      {/* Notification channels */}
      <Card className="space-y-4">
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Notifications</h2>
        {(
          [
            ["pushEnabled", "Push notifications"],
            ["emailEnabled", "Email notifications"],
            ["digestEnabled", "Weekly digest instead of individual alerts"],
          ] as [keyof UserPreferenceSummary, string][]
        ).map(([key, label]) => (
          <Toggle
            key={key}
            label={label}
            checked={!!pref[key]}
            onChange={() => toggle(key)}
          />
        ))}
      </Card>

      {/* Alert types */}
      <Card className="space-y-4">
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Alert Types</h2>
        {(
          [
            ["notifyNewEpisode", "New episode releases"],
            ["notifyMovieRelease", "Movie release dates"],
            ["notifyTheaterNearby", "Theatre showings near me"],
            ["notifyNewsUpdates", "Franchise news updates"],
            ["notifySocialUpdates", "Social media updates"],
          ] as [keyof UserPreferenceSummary, string][]
        ).map(([key, label]) => (
          <Toggle
            key={key}
            label={label}
            checked={!!pref[key]}
            onChange={() => toggle(key)}
          />
        ))}
      </Card>

      {/* Advance notice */}
      <Card className="space-y-3">
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Advance Notice</h2>
        <label className="text-sm text-gray-600">
          Alert me{" "}
          <select
            value={pref.advanceNoticeDays ?? 1}
            onChange={(e) => setPref((p) => ({ ...p, advanceNoticeDays: Number(e.target.value) }))}
            className="mx-1 rounded border border-gray-300 text-sm px-2 py-1 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          >
            {[0, 1, 2, 3, 7].map((d) => (
              <option key={d} value={d}>
                {d === 0 ? "on the day" : `${d} day${d !== 1 ? "s" : ""}`} before
              </option>
            ))}
          </select>
          a release.
        </label>
      </Card>

      {/* Location */}
      <Card className="space-y-3">
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Your Location</h2>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          loading={detecting}
          onClick={detectLocation}
        >
          Detect my location
        </Button>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Latitude</label>
            <input
              type="number"
              step="any"
              value={loc.latitude ?? ""}
              onChange={(e) => setLoc((l) => ({ ...l, latitude: Number(e.target.value) }))}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Longitude</label>
            <input
              type="number"
              step="any"
              value={loc.longitude ?? ""}
              onChange={(e) => setLoc((l) => ({ ...l, longitude: Number(e.target.value) }))}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Search radius (km)</label>
          <input
            type="number"
            min={5}
            max={200}
            value={loc.radiusKm ?? 50}
            onChange={(e) => setLoc((l) => ({ ...l, radiusKm: Number(e.target.value) }))}
            className="w-24 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </Card>

      <Button type="submit" loading={saving} className="w-full">
        {saved ? "✓ Saved!" : "Save settings"}
      </Button>
    </form>
  );
}

// ---- Internal Toggle -------------------------------------------------------

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <label className="flex items-center justify-between cursor-pointer">
      <span className="text-sm text-gray-800">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={onChange}
        className={[
          "relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2",
          checked ? "bg-indigo-600" : "bg-gray-200",
        ].join(" ")}
      >
        <span
          className={[
            "inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform",
            checked ? "translate-x-6" : "translate-x-1",
          ].join(" ")}
        />
      </button>
    </label>
  );
}
