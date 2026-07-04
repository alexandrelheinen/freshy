export type SafeAreaInsets = {
  top: number;
  right: number;
  bottom: number;
  left: number;
};

export function buildNativeSafeAreaScript(insets: SafeAreaInsets): string {
  const top = Math.max(0, Math.round(insets.top));
  const right = Math.max(0, Math.round(insets.right));
  const bottom = Math.max(0, Math.round(insets.bottom));
  const left = Math.max(0, Math.round(insets.left));

  return `(function(){try{var r=document.documentElement;r.style.setProperty('--safe-area-inset-top','${top}px');r.style.setProperty('--safe-area-inset-right','${right}px');r.style.setProperty('--safe-area-inset-bottom','${bottom}px');r.style.setProperty('--safe-area-inset-left','${left}px');}catch(e){}})();true;`;
}
