<script>
  /** @type {{ form?: { title?: string; description?: string; price?: string; category?: string; error?: string } | null }} */
  let { form } = $props();
</script>

<div class="max-w-xl mx-auto mt-10 p-6 bg-white rounded-lg shadow-md border border-gray-100">
  <h1 class="text-2xl font-bold mb-6 text-gray-800">Create a New Listing</h1>

  {#if form?.error}
    <div class="mb-4 p-3 bg-red-100 text-red-700 text-sm rounded-md">
      {form.error}
    </div>
  {/if}

  <form method="POST" class="space-y-4">
    <div>
      <label for="title" class="block text-sm font-medium text-gray-700">Listing Title</label>
      <input 
        type="text" 
        id="title" 
        name="title" 
        value={form?.title ?? ''} 
        required
        class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
      />
    </div>

    <div>
      <label for="category" class="block text-sm font-medium text-gray-700">Category</label>
      <input 
        type="text" 
        id="category" 
        name="category" 
        value={form?.category ?? ''} 
        placeholder="e.g., Electronics, Clothing"
        class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
      />
    </div>

    <div>
      <label for="price" class="block text-sm font-medium text-gray-700">Price ($)</label>
      <input 
        type="number" 
        id="price" 
        name="price" 
        step="0.01" 
        value={form?.price ?? ''} 
        required
        class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
      />
    </div>

    <div>
      <label for="description" class="block text-sm font-medium text-gray-700">Description</label>
      <textarea 
        id="description" 
        name="description" 
        rows="4" 
        required
        class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
      >{form?.description ?? ''}</textarea>
    </div>

    <button 
      type="submit" 
      class="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
    >
      Publish Listing
    </button>
  </form>
</div>