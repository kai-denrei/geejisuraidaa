// app/pwa.js — service-worker registration, gated update toast, install hint.
// No framework. Registers the SW with the cache-bust token (from <meta name=cb>)
// as ?v=, so a token bump becomes a new SW + an update prompt the user controls.

const token = document.querySelector('meta[name="cb"]')?.content || 'dev';

// --- tiny toast (dark, matches the chrome) -------------------------------
function toast(text, actionLabel, onAction) {
  const t = document.createElement('div');
  t.style.cssText = [
    'position:fixed', 'left:50%', 'bottom:16px', 'transform:translateX(-50%)',
    'display:flex', 'gap:12px', 'align-items:center', 'max-width:92vw',
    'padding:10px 14px', 'background:#1f1b16', 'border:1px solid #3c3730',
    'border-radius:8px', 'z-index:2147483646', 'color:#e7e2d6',
    'font:12px JetBrains Mono,ui-monospace,monospace',
  ].join(';');
  t.append(text);
  if (actionLabel) {
    const b = document.createElement('button');
    b.textContent = actionLabel;
    b.style.cssText = 'background:none;border:1px solid #e0a458;color:#e0a458;font:inherit;padding:5px 10px;cursor:pointer;border-radius:5px';
    b.onclick = () => { onAction?.(); t.remove(); };
    t.appendChild(b);
  }
  const x = document.createElement('button');
  x.textContent = '✕';
  x.style.cssText = 'background:none;border:none;color:#8a8278;cursor:pointer;font:inherit';
  x.onclick = () => t.remove();
  t.appendChild(x);
  document.body.appendChild(t);
  return t;
}

// --- register + update flow ----------------------------------------------
if ('serviceWorker' in navigator) {
  let reloading = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (reloading) return;
    reloading = true;
    location.reload();
  });

  const promptUpdate = (reg) => {
    if (!reg.waiting) return;
    toast('New version.', 'refresh', () => reg.waiting.postMessage({ type: 'SKIP_WAITING' }));
  };

  window.addEventListener('load', async () => {
    try {
      // Relative to the page so scope = the app's directory — works at root and
      // under a GitHub Pages sub-path. Default scope (the SW's own dir) is correct.
      const swUrl = new URL(`service-worker.js?v=${token}`, document.baseURI).href;
      const reg = await navigator.serviceWorker.register(swUrl);
      if (reg.waiting && navigator.serviceWorker.controller) promptUpdate(reg);
      reg.addEventListener('updatefound', () => {
        const sw = reg.installing;
        sw?.addEventListener('statechange', () => {
          if (sw.state === 'installed' && navigator.serviceWorker.controller) promptUpdate(reg);
        });
      });
    } catch (e) {
      console.warn('SW registration failed:', e);
    }
  });
}

// --- install: Android prompt + iOS add-to-home hint ----------------------
const standalone = matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
const dismissed = () => localStorage.getItem('gs-a2hs') === '1';
const dismiss = () => localStorage.setItem('gs-a2hs', '1');

let deferredPrompt = null;
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  if (standalone || dismissed()) return;
  const t = toast('Install.', 'add', async () => {
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    deferredPrompt = null;
    dismiss();
  });
  // dismissing the toast counts as "not now"
  t.querySelector('button:last-child')?.addEventListener('click', dismiss);
});

// iOS Safari never fires beforeinstallprompt → manual hint, once.
const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
const isSafari = /^((?!chrome|android|crios|fxios).)*safari/i.test(navigator.userAgent);
if (isIOS && isSafari && !standalone && !dismissed()) {
  window.addEventListener('load', () => {
    const t = toast('Add to Home Screen: Share → Add.');
    t.querySelector('button:last-child')?.addEventListener('click', dismiss);
  });
}
