<script lang="ts">
	import { Timer, Pause, Play, SkipForward } from 'lucide-svelte';

	interface Props {
		duration: number; // in seconds
		onComplete?: () => void;
		onSkip?: () => void;
		autoStart?: boolean; // Auto-start timer when component mounts
		soundEnabled?: boolean; // Enable sound notifications
		vibrationEnabled?: boolean; // Enable vibration
	}

	let { duration, onComplete, onSkip, autoStart = false, soundEnabled = true, vibrationEnabled = true }: Props = $props();

	// Initialize timeRemaining from duration prop
	let timeRemaining = $state(0);
	let isRunning = $state(false);
	let intervalId: ReturnType<typeof setInterval> | null = $state(null);

	$effect(() => {
		// Reset timer when duration prop changes
		timeRemaining = duration;
		// Auto-start if enabled
		if (autoStart && !isRunning && timeRemaining > 0) {
			startTimer();
		}
	});

	// Play sound when timer completes
	function playNotificationSound() {
		if (!soundEnabled) return;
		try {
			// Create a simple beep sound using Web Audio API
			const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
			const oscillator = audioContext.createOscillator();
			const gainNode = audioContext.createGain();

			oscillator.connect(gainNode);
			gainNode.connect(audioContext.destination);

			oscillator.frequency.value = 800;
			oscillator.type = 'sine';

			gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
			gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

			oscillator.start(audioContext.currentTime);
			oscillator.stop(audioContext.currentTime + 0.5);
		} catch (error) {
			console.warn('Could not play notification sound:', error);
		}
	}

	// Vibrate when timer completes
	function vibrate() {
		if (!vibrationEnabled) return;
		try {
			if ('vibrate' in navigator) {
				navigator.vibrate([200, 100, 200]);
			}
		} catch (error) {
			console.warn('Could not vibrate:', error);
		}
	}

	// Cleanup interval on unmount
	$effect(() => {
		return () => {
			if (intervalId) {
				clearInterval(intervalId);
				intervalId = null;
			}
		};
	});

		function startTimer() {
		if (intervalId) return;
		isRunning = true;
		intervalId = setInterval(() => {
			timeRemaining = Math.max(0, timeRemaining - 1);
			if (timeRemaining === 0) {
				stopTimer();
				playNotificationSound();
				vibrate();
				onComplete?.();
			}
		}, 1000);
	}

	function stopTimer() {
		if (intervalId) {
			clearInterval(intervalId);
			intervalId = null;
		}
		isRunning = false;
	}

	function toggleTimer() {
		if (isRunning) {
			stopTimer();
		} else {
			startTimer();
		}
	}

	function resetTimer() {
		stopTimer();
		timeRemaining = duration; // duration is a prop, so this is fine
	}

	function skipTimer() {
		stopTimer();
		timeRemaining = 0;
		onSkip?.();
	}

	function formatTime(seconds: number): string {
		const mins = Math.floor(seconds / 60);
		const secs = seconds % 60;
		return `${mins}:${secs.toString().padStart(2, '0')}`;
	}

	// Use $derived.by to properly capture duration prop
	const progress = $derived.by(() => {
		return (1 - timeRemaining / duration) * 100;
	});
	const isComplete = $derived(timeRemaining === 0);
</script>

<div class="rest-timer-container">
	<div class="rest-timer-header">
		<Timer class="w-5 h-5 text-[var(--color-primary)]" />
		<span class="text-sm font-semibold text-[var(--color-foreground)]">Rest Timer</span>
	</div>

	<div class="rest-timer-display">
		<div class="timer-circle">
			<svg class="timer-svg" viewBox="0 0 100 100">
				<circle
					class="timer-bg"
					cx="50"
					cy="50"
					r="45"
					fill="none"
					stroke="var(--color-border)"
					stroke-width="8"
				/>
				<circle
					class="timer-progress"
					cx="50"
					cy="50"
					r="45"
					fill="none"
					stroke="var(--color-primary)"
					stroke-width="8"
					stroke-linecap="round"
					stroke-dasharray={283}
					stroke-dashoffset={283 - (progress * 283) / 100}
					transform="rotate(-90 50 50)"
				/>
			</svg>
			<div class="timer-text">
				<span class="timer-value">{formatTime(timeRemaining)}</span>
				{#if isComplete}
					<span class="timer-status text-[var(--color-accent)]">Rest Complete!</span>
				{:else if isRunning}
					<span class="timer-status text-[var(--color-primary)]">Resting...</span>
				{:else}
					<span class="timer-status text-[var(--color-muted)]">Paused</span>
				{/if}
			</div>
		</div>
	</div>

	<div class="rest-timer-controls">
		<button
			onclick={toggleTimer}
			disabled={isComplete}
			class="timer-button primary"
			title={isRunning ? 'Pause' : 'Start'}
		>
			{#if isRunning}
				<Pause class="w-5 h-5" />
			{:else}
				<Play class="w-5 h-5" />
			{/if}
		</button>
		<button onclick={resetTimer} class="timer-button secondary" title="Reset">
			Reset
		</button>
		{#if onSkip}
			<button onclick={skipTimer} class="timer-button secondary" title="Skip Rest">
				<SkipForward class="w-4 h-4" />
				Skip
			</button>
		{/if}
	</div>
</div>

<style>
	.rest-timer-container {
		background: var(--color-card);
		border: 2px solid var(--color-primary);
		border-radius: var(--radius-lg);
		padding: 1.5rem;
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.rest-timer-header {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.rest-timer-display {
		display: flex;
		justify-content: center;
		align-items: center;
	}

	.timer-circle {
		position: relative;
		width: 200px;
		height: 200px;
	}

	.timer-svg {
		width: 100%;
		height: 100%;
		transform: rotate(-90deg);
	}

	.timer-progress {
		transition: stroke-dashoffset 0.3s ease;
	}

	.timer-text {
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		text-align: center;
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.timer-value {
		font-size: 2rem;
		font-weight: bold;
		color: var(--color-foreground);
		line-height: 1;
	}

	.timer-status {
		font-size: 0.75rem;
		font-weight: 500;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.rest-timer-controls {
		display: flex;
		gap: 0.75rem;
		justify-content: center;
		align-items: center;
	}

	.timer-button {
		padding: 0.75rem 1.5rem;
		border-radius: 0.5rem;
		font-weight: 600;
		transition: all var(--transition-normal);
		display: flex;
		align-items: center;
		gap: 0.5rem;
		border: none;
		cursor: pointer;
	}

	.timer-button.primary {
		background: var(--gradient-primary);
		color: white;
		flex: 1;
		justify-content: center;
	}

	.timer-button.primary:hover:not(:disabled) {
		transform: scale(1.05);
		box-shadow: 0 4px 12px rgba(255, 107, 53, 0.4);
	}

	.timer-button.secondary {
		background: var(--color-card-hover);
		color: var(--color-foreground);
		border: 1px solid var(--color-border);
	}

	.timer-button.secondary:hover {
		background: var(--color-primary);
		color: white;
		border-color: var(--color-primary);
	}

	.timer-button:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
</style>
