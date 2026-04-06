<script lang="ts">
	import { page } from '$app/stores';
	import { Home, PlusCircle, TrendingUp, User } from 'lucide-svelte';

	const navItems = [
		{ label: 'Home', icon: Home, href: '/', exact: true },
		{ label: 'Log', icon: PlusCircle, href: '/log', prefixes: ['/log', '/workout'] },
		{ label: 'Progress', icon: TrendingUp, href: '/progress', prefixes: ['/progress'] },
		{ label: 'You', icon: User, href: '/you', prefixes: ['/you', '/profile'] }
	];

	function isActive(item: (typeof navItems)[number]): boolean {
		const path = $page.url.pathname;
		if (item.exact) return path === item.href;
		return item.prefixes?.some((p) => path.startsWith(p)) ?? false;
	}
</script>

<nav class="fixed bottom-0 left-0 right-0 z-50 border-t border-[var(--color-border)] bg-[var(--color-card)]">
	<div class="mx-auto flex max-w-md items-stretch">
		{#each navItems as item}
			{@const active = isActive(item)}
			<a
				href={item.href}
				class="relative flex flex-1 flex-col items-center justify-center gap-1 py-3 transition-colors duration-150
					{active ? 'text-[var(--color-primary)]' : 'text-[var(--color-muted)] hover:text-[var(--color-muted-light)]'}"
			>
				{#if active}
					<span class="absolute top-0 left-1/2 h-0.5 w-8 -translate-x-1/2 rounded-full bg-[var(--color-primary)]"></span>
				{/if}
				<svelte:component this={item.icon} size={22} strokeWidth={active ? 2.2 : 1.8} />
				<span class="text-[10px] font-medium tracking-wide">{item.label}</span>
			</a>
		{/each}
	</div>
</nav>
