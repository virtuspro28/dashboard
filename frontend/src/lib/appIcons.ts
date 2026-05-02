const APP_ICON_MAP: Record<string, string> = {
  'plex': '/assets/icons/plex.svg',
  'plex-media-server': '/assets/icons/plex.svg',
  'nextcloud': '/assets/icons/nextcloud.svg',
  'pi-hole': '/assets/icons/pihole.svg',
  'pihole': '/assets/icons/pihole.svg',
  'jellyfin': '/assets/icons/jellyfin.svg',
  'home-assistant': '/assets/icons/home-assistant.svg',
  'home assistant': '/assets/icons/home-assistant.svg',
  'homeassistant': '/assets/icons/home-assistant.svg',
};

function normalizeAppKey(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/^\/+/, '')
    .replace(/[_\s]+/g, '-');
}

export function resolveAppIconAsset(...candidates: Array<string | undefined | null>): string | null {
  for (const candidate of candidates) {
    if (!candidate) {
      continue;
    }

    const normalized = normalizeAppKey(candidate);
    if (APP_ICON_MAP[normalized]) {
      return APP_ICON_MAP[normalized];
    }

    const compact = normalized.replace(/[^a-z0-9-]/g, '');
    if (APP_ICON_MAP[compact]) {
      return APP_ICON_MAP[compact];
    }
  }

  return null;
}
