export const NAVIGATION_START_EVENT = "prompt-ide:navigation-start"
export const SEARCH_DIALOG_OPEN_EVENT = "prompt-ide:search-open"

export function emitNavigationStart(targetPath?: string) {
  if (typeof window === "undefined") return
  window.dispatchEvent(
    new CustomEvent(NAVIGATION_START_EVENT, {
      detail: { targetPath },
    })
  )
}

export function emitSearchDialogOpen() {
  if (typeof window === "undefined") return
  window.dispatchEvent(new CustomEvent(SEARCH_DIALOG_OPEN_EVENT))
}
