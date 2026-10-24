<script>
  import { untrack } from 'svelte';

  let { data } = $props();

  let cartItems = $state(untrack(() => data.cart || []));

  let checkoutStatus = $state('');

  let totalPrice = $derived(
    cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0).toFixed(2)
  );

    /**
     * Updates the quantity of an item in the cart.
     * @param {number | string} id 
     * @param {number} delta 
     */
  function updateQuantity(id, delta) {
    cartItems = cartItems.map(item => {
      if (item.id === id) {
        const newQty = item.quantity + delta;
        return { ...item, quantity: newQty > 0 ? newQty : 1 };
      }
      return item;
    });
  }

  /**
   * Removes an item from the cart.
   * @param {number | string} id 
   */
  function removeItem(id) {
    cartItems = cartItems.filter(item => item.id !== id);
  }

  function handleDummyCheckout() {
    if (cartItems.length === 0) {
      checkoutStatus = 'Your cart is empty!';
      return;
    }
    checkoutStatus = 'Processing dummy checkout...';
    
    // Simulate network delay for checkout
    setTimeout(() => {
      checkoutStatus = 'Order placed successfully! 🎉 (Mock Checkout)';
      cartItems = []; // Clear cart on success
    }, 1200);
  }
</script>

<div class="max-w-3xl mx-auto px-6 py-10">
  <div class="flex justify-between items-center mb-8" style="text-align: center;">
    <h1 class="text-3xl font-bold text-gray-900">Your Shopping Cart</h1>
    <a href="/" class="text-sm text-indigo-600 hover:underline">&larr; Back to Dashboard Hub</a>
  </div>

  {#if checkoutStatus}
    <div class="mb-6 p-4 bg-indigo-50 border border-indigo-200 text-indigo-800 rounded-lg text-center font-medium shadow-sm">
      {checkoutStatus}
    </div>
  {/if}

  {#if cartItems.length === 0 && !checkoutStatus.includes('Success')}
    <div class="bg-gray-50 border border-gray-200 rounded-xl p-12 text-center" style="text-align: left;">
      <p class="text-gray-500 text-lg mb-4">Your cart is currently empty.</p>
      <a href="/listings" class="inline-block px-6 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg shadow hover:bg-indigo-700 transition">
        Browse Marketplace
      </a>
    </div>
  {:else if cartItems.length > 0}
    <div class="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden mb-8" style="text-align: left;">
      <ul class="divide-y divide-gray-200">
        {#each cartItems as item (item.id)}
          <li class="p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <span class="inline-block px-2.5 py-0.5 text-xs font-semibold bg-gray-100 text-gray-600 rounded-full mb-1">{item.category}</span>
              <h3 class="text-lg font-semibold text-gray-800">{item.title}</h3>
              <p class="text-indigo-600 font-medium">${item.price.toFixed(2)} each</p>
            </div>

            <div class="flex items-center gap-6 w-full sm:w-auto justify-between sm:justify-end">
              <!-- Quantity Controls -->
              <div class="flex items-center border border-gray-300 rounded-lg overflow-hidden">
                <button 
                  onclick={() => updateQuantity(item.id, -1)}
                  class="px-3 py-1 bg-gray-50 hover:bg-gray-100 text-gray-600 font-bold transition"
                >-</button>
                <span class="px-4 py-1 text-gray-800 font-medium">{item.quantity}</span>
                <button 
                  onclick={() => updateQuantity(item.id, 1)}
                  class="px-3 py-1 bg-gray-50 hover:bg-gray-100 text-gray-600 font-bold transition"
                >+</button>
              </div>

              <!-- Remove Button -->
              <button 
                onclick={() => removeItem(item.id)}
                class="text-sm text-red-500 hover:text-red-700 font-medium"
              >
                Remove
              </button>
            </div>
          </li>
        {/each}
      </ul>

      <div class="bg-gray-50 p-6 border-t border-gray-200 flex flex-col sm:flex-row justify-between items-center gap-4" style="text-align: right;">
        <div class="text-lg font-bold text-gray-800">
          Total: <span class="text-indigo-600">${totalPrice}</span>
        </div>

        <button 
          onclick={handleDummyCheckout}
          class="w-full sm:w-auto px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg shadow transition"
        >
          Proceed to Checkout (Dummy)
        </button>
      </div>
    </div>
  {/if}
</div>