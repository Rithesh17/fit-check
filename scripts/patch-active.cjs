const fs = require('fs');
const file = 'C:/Users/rithh/Documents/Work/fit-check/src/routes/workout/active/+page.svelte';
let content = fs.readFileSync(file, 'utf8');

// --- Patch 1: Replace round overview items with reorder/remove buttons ---
const searchFor = '{#each exercisesInCurrentRound as item}';
const searchEnd = '{/each}';

const idx = content.indexOf(searchFor);
if (idx === -1) { console.log('PATCH1 start not found'); process.exit(1); }
const endIdx = content.indexOf(searchEnd, idx);
if (endIdx === -1) { console.log('PATCH1 end not found'); process.exit(1); }
const endFull = endIdx + searchEnd.length;

const oldBlock = content.slice(idx, endFull);
console.log('Found block at', idx, '-', endFull);

const newBlock = `{#each exercisesInCurrentRound as item}
\t\t\t\t\t\t\t\t<div class="flex items-center gap-1 {item.isCurrent ? 'bg-[var(--color-primary)]/10 border border-[var(--color-primary)]/50 rounded' : ''}">
\t\t\t\t\t\t\t\t\t<button
\t\t\t\t\t\t\t\t\t\tonclick={() => jumpToExerciseInRound(item.exerciseIndex, item.setIndex)}
\t\t\t\t\t\t\t\t\t\tclass="flex-1 flex items-center justify-between p-2 rounded hover:bg-[var(--color-background)] transition-colors text-left min-w-0"
\t\t\t\t\t\t\t\t\t>
\t\t\t\t\t\t\t\t\t\t<div class="flex items-center gap-2 flex-1 min-w-0">
\t\t\t\t\t\t\t\t\t\t\t{#if item.completed}
\t\t\t\t\t\t\t\t\t\t\t\t<Check class="w-4 h-4 text-[var(--color-accent)] flex-shrink-0" />
\t\t\t\t\t\t\t\t\t\t\t{:else if item.isCurrent}
\t\t\t\t\t\t\t\t\t\t\t\t<ChevronRight class="w-4 h-4 text-[var(--color-primary)] flex-shrink-0" />
\t\t\t\t\t\t\t\t\t\t\t{:else}
\t\t\t\t\t\t\t\t\t\t\t\t<div class="w-4 h-4 rounded-full border-2 border-[var(--color-muted)] flex-shrink-0"></div>
\t\t\t\t\t\t\t\t\t\t\t{/if}
\t\t\t\t\t\t\t\t\t\t\t<span class="text-sm font-medium text-[var(--color-foreground)] truncate {item.isCurrent ? 'font-bold' : ''}">
\t\t\t\t\t\t\t\t\t\t\t\t{item.exercise.name}
\t\t\t\t\t\t\t\t\t\t\t</span>
\t\t\t\t\t\t\t\t\t\t</div>
\t\t\t\t\t\t\t\t\t\t<div class="text-xs text-[var(--color-muted)] flex-shrink-0 ml-2">
\t\t\t\t\t\t\t\t\t\t\t{#if isTimeBasedExercise(item.exercise)}
\t\t\t\t\t\t\t\t\t\t\t\t{item.set.durationSeconds || 0}s
\t\t\t\t\t\t\t\t\t\t\t{:else}
\t\t\t\t\t\t\t\t\t\t\t\t{item.set.reps} reps {item.set.weight > 0 ? '• ' + formatWeight(item.set.weight, currentUnit) : ''}
\t\t\t\t\t\t\t\t\t\t\t{/if}
\t\t\t\t\t\t\t\t\t\t</div>
\t\t\t\t\t\t\t\t\t</button>
\t\t\t\t\t\t\t\t\t<div class="flex items-center flex-shrink-0">
\t\t\t\t\t\t\t\t\t\t<button
\t\t\t\t\t\t\t\t\t\t\tonclick={() => moveExerciseUp(item.exerciseIndex)}
\t\t\t\t\t\t\t\t\t\t\tdisabled={item.exerciseIndex === 0}
\t\t\t\t\t\t\t\t\t\t\tclass="p-1 text-[var(--color-muted)] hover:text-[var(--color-foreground)] disabled:opacity-30 transition-colors"
\t\t\t\t\t\t\t\t\t\t\ttitle="Move up"
\t\t\t\t\t\t\t\t\t\t>
\t\t\t\t\t\t\t\t\t\t\t<ArrowUp class="w-3.5 h-3.5" />
\t\t\t\t\t\t\t\t\t\t</button>
\t\t\t\t\t\t\t\t\t\t<button
\t\t\t\t\t\t\t\t\t\t\tonclick={() => moveExerciseDown(item.exerciseIndex)}
\t\t\t\t\t\t\t\t\t\t\tdisabled={item.exerciseIndex === selectedExercises.length - 1}
\t\t\t\t\t\t\t\t\t\t\tclass="p-1 text-[var(--color-muted)] hover:text-[var(--color-foreground)] disabled:opacity-30 transition-colors"
\t\t\t\t\t\t\t\t\t\t\ttitle="Move down"
\t\t\t\t\t\t\t\t\t\t>
\t\t\t\t\t\t\t\t\t\t\t<ArrowDown class="w-3.5 h-3.5" />
\t\t\t\t\t\t\t\t\t\t</button>
\t\t\t\t\t\t\t\t\t\t<button
\t\t\t\t\t\t\t\t\t\t\tonclick={() => removeExercise(item.exerciseIndex)}
\t\t\t\t\t\t\t\t\t\t\tclass="p-1 text-[var(--color-muted)] hover:text-red-400 transition-colors"
\t\t\t\t\t\t\t\t\t\t\ttitle="Remove exercise"
\t\t\t\t\t\t\t\t\t\t>
\t\t\t\t\t\t\t\t\t\t\t<Trash2 class="w-3.5 h-3.5" />
\t\t\t\t\t\t\t\t\t\t</button>
\t\t\t\t\t\t\t\t\t</div>
\t\t\t\t\t\t\t\t</div>
\t\t\t\t\t\t\t{/each}
\t\t\t\t\t\t\t<button
\t\t\t\t\t\t\t\tonclick={() => (showExercisePicker = true)}
\t\t\t\t\t\t\t\tclass="w-full flex items-center justify-center gap-2 p-2 rounded border border-dashed border-[var(--color-border)] text-[var(--color-muted)] hover:text-[var(--color-primary)] hover:border-[var(--color-primary)] transition-colors text-sm mt-1"
\t\t\t\t\t\t\t>
\t\t\t\t\t\t\t\t<Plus class="w-4 h-4" />
\t\t\t\t\t\t\t\tAdd Exercise
\t\t\t\t\t\t\t</button>`;

content = content.slice(0, idx) + newBlock + content.slice(endFull);
console.log('Patch 1 applied');

// --- Patch 2: Add previous set hint after weight label ---
const prevHintTarget = '\t\t\t\t\t\t\t\t\t\t\t</div>\n\r\n\t\t\t\t\t\t\t\t\t\t\t<!-- Weight Input -->';
// Find weight input section and add hint after it
// Look for the Weight label block
const weightSectionMarker = "\t\t\t\t\t\t\t\t\t\t\t<!-- Weight Input -->";
const wIdx = content.indexOf(weightSectionMarker);
if (wIdx === -1) { console.log('Weight section not found - skipping hint patch'); }
else {
  // Find the closing </div> of the weight input section - this is after the quick weight buttons
  // Look for pattern: closing the weight section div (after quick buttons)
  // We'll add previous set hint just before the Rest Input section
  const restMarker = "\t\t\t\t\t\t\t\t\t\t\t<!-- Rest / Notes (optional) -->";
  const rIdx = content.indexOf(restMarker, wIdx);
  if (rIdx === -1) { console.log('Rest marker not found - skipping hint patch'); }
  else {
    // Find the closing </div> just before the rest marker
    const beforeRest = content.lastIndexOf('</div>', rIdx - 1);
    const afterDiv = beforeRest + '</div>'.length;

    const hint = `\r\n\r\n\t\t\t\t\t\t\t\t\t\t\t<!-- Previous set autofill hint -->\r\n\t\t\t\t\t\t\t\t\t\t\t{#if currentExercise && previousSetData[currentExercise.id]}\r\n\t\t\t\t\t\t\t\t\t\t\t\t{@const prev = previousSetData[currentExercise.id][Math.min(currentSetIndex, previousSetData[currentExercise.id].length - 1)]}\r\n\t\t\t\t\t\t\t\t\t\t\t\t{#if prev}\r\n\t\t\t\t\t\t\t\t\t\t\t\t\t<p class="text-xs text-[var(--color-muted)] text-center -mt-2 mb-2">\r\n\t\t\t\t\t\t\t\t\t\t\t\t\t\tLast: {prev.reps} reps \u00d7 {formatWeight(prev.weight, currentUnit)}\r\n\t\t\t\t\t\t\t\t\t\t\t\t\t</p>\r\n\t\t\t\t\t\t\t\t\t\t\t\t{/if}\r\n\t\t\t\t\t\t\t\t\t\t\t{/if}`;

    content = content.slice(0, afterDiv) + hint + content.slice(afterDiv);
    console.log('Patch 2 (prev hint) applied');
  }
}

// --- Patch 3: Add exercise picker modal before </style> ---
const styleMarker = '\r\n<style>';
const styleIdx = content.lastIndexOf(styleMarker);
if (styleIdx === -1) { console.log('Style marker not found'); process.exit(1); }

const modal = `\r\n\r\n<!-- Exercise Picker Modal -->\r\n{#if showExercisePicker}\r\n\t<div\r\n\t\tclass="fixed inset-0 bg-black/60 z-50 flex items-end"\r\n\t\tonclick={() => (showExercisePicker = false)}\r\n\t\trole="dialog"\r\n\t\taria-modal="true"\r\n\t\taria-label="Add exercise"\r\n\t>\r\n\t\t<div\r\n\t\t\tclass="w-full max-w-md mx-auto bg-[var(--color-background)] rounded-t-2xl max-h-[75vh] flex flex-col"\r\n\t\t\tonclick={(e) => e.stopPropagation()}\r\n\t\t>\r\n\t\t\t<div class="flex items-center justify-between px-4 py-3 border-b border-[var(--color-border)]">\r\n\t\t\t\t<h3 class="font-bold text-[var(--color-foreground)]">Add Exercise</h3>\r\n\t\t\t\t<button\r\n\t\t\t\t\tonclick={() => (showExercisePicker = false)}\r\n\t\t\t\t\tclass="text-[var(--color-muted)] hover:text-[var(--color-foreground)] transition-colors"\r\n\t\t\t\t\taria-label="Close"\r\n\t\t\t\t>\r\n\t\t\t\t\t<X class="w-5 h-5" />\r\n\t\t\t\t</button>\r\n\t\t\t</div>\r\n\t\t\t<div class="px-4 py-3 border-b border-[var(--color-border)]">\r\n\t\t\t\t<div class="relative">\r\n\t\t\t\t\t<Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-muted)]" />\r\n\t\t\t\t\t<input\r\n\t\t\t\t\t\ttype="text"\r\n\t\t\t\t\t\tbind:value={exercisePickerSearch}\r\n\t\t\t\t\t\tplaceholder="Search exercises..."\r\n\t\t\t\t\t\tclass="w-full pl-9 pr-4 py-2 bg-[var(--color-card)] border border-[var(--color-border)] rounded-lg text-[var(--color-foreground)] text-sm focus:outline-none focus:border-[var(--color-primary)]"\r\n\t\t\t\t\t/>\r\n\t\t\t\t</div>\r\n\t\t\t</div>\r\n\t\t\t<div class="overflow-y-auto flex-1 p-2">\r\n\t\t\t\t{#each pickerExercises as ex (ex.id)}\r\n\t\t\t\t\t<button\r\n\t\t\t\t\t\tonclick={() => addExerciseMidWorkout(ex)}\r\n\t\t\t\t\t\tclass="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-[var(--color-card)] transition-colors text-left"\r\n\t\t\t\t\t>\r\n\t\t\t\t\t\t<div class="flex-1 min-w-0">\r\n\t\t\t\t\t\t\t<div class="text-sm font-medium text-[var(--color-foreground)] truncate">{ex.name}</div>\r\n\t\t\t\t\t\t\t<div class="text-xs text-[var(--color-muted)]">{ex.muscleGroups.slice(0, 2).join(', ')} \u2022 {ex.exerciseType}</div>\r\n\t\t\t\t\t\t</div>\r\n\t\t\t\t\t\t<Plus class="w-4 h-4 text-[var(--color-primary)] flex-shrink-0" />\r\n\t\t\t\t\t</button>\r\n\t\t\t\t{/each}\r\n\t\t\t\t{#if pickerExercises.length === 0}\r\n\t\t\t\t\t<p class="text-center text-[var(--color-muted)] py-8 text-sm">No exercises found</p>\r\n\t\t\t\t{/if}\r\n\t\t\t</div>\r\n\t\t</div>\r\n\t</div>\r\n{/if}`;

content = content.slice(0, styleIdx) + modal + content.slice(styleIdx);
console.log('Patch 3 (modal) applied');

fs.writeFileSync(file, content);
console.log('All patches applied successfully');
