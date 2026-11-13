<main style="max-width: 400px; margin: 4rem auto; font-family: sans-serif; padding: 0 1rem; text-align: center;">
  <div class="background-panels">
      
      <img src="/images/ArmyPnt.jpg" alt="" />
      
  </div>
  
  <header class="border-2 border-slate-800 rounded-lg">
    <h1>Welcome to Models and Minis</h1>
  </header>
  
</main>

<style>
  header {
    background-image:
        linear-gradient(rgba(0, 0, 0, 0.45), rgba(0, 0, 0, 0.45)),
        url('/SRC/lib/assets/Gunpla.jpg');
    background-size: cover;
    background-position: center;
    background-repeat: no-repeat;
    padding: 3rem;
    color: white;
  }

  main {
    position: relative;
    min-height: 100vh;
  }

  .background-panels {
    position: fixed;
    inset: 0;
    display: grid;
    grid-template-columns: 2fr ;
    z-index: -1;
  }

  .background-panels img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

</style>