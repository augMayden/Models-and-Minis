<script>
  /** @type {{ data: { user?: { username?: string; email?: string; roles?: string[] } | null }, children?: import('svelte').Snippet }} */
  let { data, children } = $props();
</script>

<!-- Global Top Right User Ribbon (Appears on every page!) -->
{#if data.user}
  <div class="absolute top-4 right-4 z-50 bg-gray-200 text-gray-800 px-4 py-2 rounded-full shadow-sm text-sm font-medium flex items-center gap-2">
    <span class="w-2.5 h-2.5 bg-green-500 rounded-full"></span>
    <span>Logged in as: <strong>{data.user.username}</strong></span>
  </div>
{/if}

{@render children?.()}