<script>
  import '../app.css';

  let { data, children } = $props();
  let user = $derived(data.user);

  let isSeller = $derived(user?.role.includes('Seller'));
  let isAdmin = $derived(user?.role.includes('Admin'));
  let isBuyer = $derived(user?.role.includes('Buyer'));
</script>

<div class="min-h-screen bg-slate-50 text-slate-900">
  
  <!-- Top Navigation Banner -->
  <header class="bg-slate-900 text-white">
    <div class="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
      
      <!-- Logo / Home Link -->
      <a href="/" class="font-bold text-lg tracking-tight text-white hover:text-indigo-400 transition">
        Marketplace Hub
      </a>

      <!-- Navigation Actions -->
      <nav class="flex items-center gap-3">

        {#if !user}
          <a href="/login" class="px-3 py-1.5 text-sm font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition">
            Login
          </a>
          <a href="/register" class="px-3 py-1.5 text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition">
            Register
          </a>
        {:else}
          <a href="/profile" class="px-3 py-1.5 text-sm font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition">
            {user?.username}
          </a>

          <a href="/listings" class="px-3 py-1.5 text-sm font-medium bg-slate-800 text-slate-200 hover:bg-slate-700 transition">
              Listings
          </a>


          {#if isBuyer}
            <!-- Buyer Cart -->
            <a href="/buyer/cart" class="px-3 py-1.5 text-sm font-medium bg-slate-800 text-slate-200 hover:bg-slate-700 transition">
              🛒 Cart
            </a>
          {/if}

          <!-- Seller Panel (Conditional) -->
          {#if isSeller}
            <a href="/seller/listings/new" class="px-3 py-1.5 text-sm font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition">
              Seller Panel
            </a>
          {/if}

          <!-- Admin Panel (Conditional) -->
          {#if isAdmin}
            <a href="/users" class="px-3 py-1.5 text-sm font-semibold bg-purple-600 hover:bg-purple-500 text-white transition">
              Users
            </a>
          {/if}

          <!-- Logout -->
          <form action="/logout" method="POST" class="inline ml-2">
            <button type="submit" class="px-3 py-1.5 text-sm font-medium text-rose-400 hover:bg-rose-950/50 hover:text-rose-300 transition">
              Logout
            </button>
          </form>
        {/if}
      </nav>
    </div>
  </header>

  <!-- Main Content Container -->
  <main class="max-w-7xl mx-auto p-6">
    {@render children()}
  </main>

</div>