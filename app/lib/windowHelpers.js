// Helper to open a new window and (optionally) close it automatically after a timeout.
// Note: to be able to programmatically close the opened window we MUST keep the
// Window reference returned by `window.open`. Avoid using `noopener` in the
// third argument. Some browsers may still block popups; handle failures gracefully.
export function openAndAutoClose(url, timeout = 3000) {
  if (typeof window === 'undefined') return null

  try {
    // Open a small popup window (no noopener so we can close it later)
    const features = 'toolbar=0,location=0,menubar=0,width=800,height=600'
    const win = window.open(url, '_blank', features)
    if (!win) return null

    try { win.focus() } catch (e) { /* ignore */ }

    // Close automatically after timeout. If the user interacts, closing may be
    // annoying; keep timeout conservative (default 3s). Caller can choose longer/shorter.
    const timer = setTimeout(() => {
      try { win.close() } catch (e) { /* ignore */ }
    }, timeout)

    // Return handle in case caller wants to cancel the auto-close
    return { win, timer }
  } catch (err) {
    console.warn('openAndAutoClose failed', err)
    return null
  }
}
