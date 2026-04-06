/**
 * Chart.js renders to canvas and does not resolve CSS custom properties.
 * Read computed theme colors from the document for ticks, grids, and datasets.
 */
const FALLBACK = {
	foreground: '#ffffff',
	muted: '#a3a3a3',
	border: '#404040',
	primary: '#ff6b35',
	secondary: '#00d9ff',
	card: '#0f0f0f',
	background: '#000000'
} as const;

export type ChartTheme = typeof FALLBACK;

export function getChartTheme(): ChartTheme {
	if (typeof document === 'undefined') return { ...FALLBACK };
	const root = document.documentElement;
	const get = (name: string, fb: string) => {
		const v = getComputedStyle(root).getPropertyValue(name).trim();
		return v || fb;
	};
	return {
		foreground: get('--color-foreground', FALLBACK.foreground),
		muted: get('--color-muted', FALLBACK.muted),
		border: get('--color-border', FALLBACK.border),
		primary: get('--color-primary', FALLBACK.primary),
		secondary: get('--color-secondary', FALLBACK.secondary),
		card: get('--color-card', FALLBACK.card),
		background: get('--color-background', FALLBACK.background)
	};
}

/** rgba() from a #rrggbb (or #rgb) hex */
export function hexToRgba(hex: string, alpha: number): string {
	const h = hex.replace('#', '');
	const full =
		h.length === 3 ? h.split('').map((c) => c + c).join('') : h.length === 6 ? h : null;
	if (!full) return `rgba(255, 107, 53, ${alpha})`;
	const n = parseInt(full, 16);
	const r = (n >> 16) & 255;
	const g = (n >> 8) & 255;
	const b = n & 255;
	return `rgba(${r},${g},${b},${alpha})`;
}
