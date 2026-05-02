export const CONTAINERS_CHANGED_EVENT = 'homevault:containers-changed';

export function dispatchContainersChanged(): void {
  window.dispatchEvent(new CustomEvent(CONTAINERS_CHANGED_EVENT));
}
