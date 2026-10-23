<script>
    import { enhance } from '$app/forms';

    let { form } = $props();

    /** @param {string} type */
    const isChecked = (type) => {
        // Explicitly check if accountTypes exists and is an array before checking includes
        if (!form || !form.accountTypes) return false;
        return form.accountTypes.includes(type);
    };
</script>

<main style="max-width: 400px; margin: 4rem auto; font-family: sans-serif; padding: 0 1rem; text-align: center;">
    <h1>Register</h1>

    <form method="POST" use:enhance>
        {#if form?.error}
            <div style="background-color: #ffe6e6; color: #d00; padding: 10px; margin-bottom: 1rem; border-radius: 4px; border: 1px solid #f99;">
                {form.error}
            </div>
        {/if}

        <div style="color: #666; margin-bottom: 2rem;">
            <label for="username">Username:</label>
            <br />
            <input
                type="text"
                id="username"
                name="username"
                required
            />
            <br />
            <br />
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
            <br />
            <br />
            <label for="confirm-password">Confirm Password:</label>
            <br />
            <input
                type="password"
                id="confirm-password" 
                name="confirm-password" 
                required
            />
            <br />
            <br />
            <fieldset style="border: 1px solid #ccc; padding: 1rem; border-radius: 4px; margin-bottom: 1.5rem;">
                <legend style="padding: 0 0.5rem; font-weight: bold;">Select Account Type(s)</legend>
                
                <div style="display: flex; gap: 1.5rem; margin-top: 0.5rem;">
                    <label style="cursor: pointer;">
                    <input type="checkbox" name="accountTypes" value="Buyer" checked={isChecked('Buyer')} /> Buyer
                    </label>
                    
                    <label style="cursor: pointer;">
                    <input type="checkbox" name="accountTypes" value="Seller" checked={isChecked('Seller')} /> Seller
                    </label>
                    
                    <label style="cursor: pointer;">
                    <input type="checkbox" name="accountTypes" value="Admin" checked={isChecked('Admin')} /> Admin
                    </label>
                </div>
            </fieldset>
        </div>

        <div style="display: flex; justify-content: center; gap: 1rem;">
            <button 
            type="submit" 
            style="padding: 0.5rem 1.5rem; background-color: #007bff; color: white; text-decoration: none; border-radius: 4px;"
            >
            Register
            </button>
        </div>
    </form>

    <p>Already have an account? <a href="/login">Log in here</a></p>
</main>
