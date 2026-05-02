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
  'adguard-home': '/assets/icons/adguard-home.svg',
  'immich': '/assets/icons/immich.svg',
  'gitea': '/assets/icons/gitea.svg',
  'nginx-proxy-manager': '/assets/icons/nginx-proxy-manager.svg',
  'vaultwarden': '/assets/icons/vaultwarden.svg',
  'portainer': '/assets/icons/portainer.svg',
  'grafana': '/assets/icons/grafana.svg',
  'influxdb': '/assets/icons/influxdb.svg',
  'node-red': '/assets/icons/node-red.svg',
  'paperless-ngx': '/assets/icons/paperless-ngx.svg',
  'transmission': '/assets/icons/transmission.svg',
  'qbittorrent': '/assets/icons/qbittorrent.svg',
  'airdcpp': '/assets/icons/airdcpp.svg',
  'airdc++': '/assets/icons/airdcpp.svg',
  'sonarr': '/assets/icons/sonarr.svg',
  'radarr': '/assets/icons/radarr.svg',
  'prowlarr': '/assets/icons/prowlarr.svg',
  'overseerr': '/assets/icons/overseerr.svg',
  'lidarr': '/assets/icons/lidarr.svg',
  'bazarr': '/assets/icons/bazarr.svg',
  'syncthing': '/assets/icons/syncthing.svg',
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
