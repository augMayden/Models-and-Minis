<script>
    import { enhance } from '$app/forms';
    let { form } = $props();
</script>

<main style="max-width: 400px; margin: 4rem auto; font-family: sans-serif; padding: 0 1rem; text-align: center;">
    <h1>Log In</h1>

    <form method="POST" use:enhance>
        {#if form?.error}
            <div style="background-color: #ffe6e6; color: #d00; padding: 10px; margin-bottom: 1rem; border-radius: 4px; border: 1px solid #f99;">
                {form.error}
            </div>
        {/if}

        <div style="color: #666; margin-bottom: 2rem;">
            <label for="email">Email:</label>
            <br />
            <input
                type="email" 
                id="email" 
                name="email"
                required
            />
            <br />
            <br />
        
            <label for="password">Password:</label>
            <br />
            <input
                type="password"
                id="password" 
                name="password" 
                required
            />
        </div>

        <div style="display: flex; justify-content: center; gap: 1rem;">
            <button 
            type="submit" 
            style="padding: 0.5rem 1.5rem; background-color: #007bff; color: white; text-decoration: none; border-radius: 4px;"
            >
            Log In
            </button>
        </div>
    </form>

    <p>Don't have an account? <a href="/register">Register here</a></p>
</main>
