<script lang="ts">
	import { page } from '$app/stores';
	import { Home, Activity, TrendingUp, User } from 'lucide-svelte';

	const navItems = [
		{ path: '/', label: 'Home', icon: Home },
		{ path: '/workouts', label: 'Workouts', icon: Activity },
		{ path: '/progress', label: 'Progress', icon: TrendingUp },
		{ path: '/profile', label: 'Profile', icon: User }
	];

	let currentPath = $derived($page.url.pathname);
</script>

<nav class="fixed bottom-0 left-0 right-0 z-50 bg-[var(--color-card)] border-t border-[var(--color-border)]">
	<div class="max-w-md mx-auto">
		<div class="flex items-center justify-around px-2 py-2">
			{#each navItems as item}
				<a
					href={item.path}
					class="flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition-colors {currentPath === item.path
						? 'text-[var(--color-primary)]'
						: 'text-[var(--color-muted)]'}"
				>
					<svelte:component this={item.icon} class="w-6 h-6" />
					<span class="text-xs font-medium">{item.label}</span>
					{#if currentPath === item.path}
						<div class="absolute bottom-0 w-8 h-1 bg-[var(--color-primary)] rounded-t-full"></div>
					{/if}
				</a>
			{/each}
		</div>
	</div>
</nav>

<style>
	nav a {
		position: relative;
	}
</style>
