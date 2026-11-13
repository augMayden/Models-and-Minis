<script>
  /**
   * @type {{
   *   data: {
   *     orders: Array<{
   *       _id: string,
   *       items: Array<{ _id: string, listingId: string, name: string, price: number, quantity: number }>,
   *       total: number,
   *       fulfillmentState: string,
   *       shippingInfo: string,
   *       createdAt: string
   *     }>,
   *     isSeller: boolean,
   *     error: string
   *   }
   * }}
   */
  let { data } = $props();

  /** @param {number} n */
  const money = (n) => `$${Number(n ?? 0).toFixed(2)}`;

  /** @param {string} d */
  const dateLabel = (d) => {
    if (!d) return '';
    const date = new Date(d);
    return Number.isNaN(date.getTime()) ? '' : date.toLocaleString();
  };

  /** @param {string} s */
  const stateClass = (s) => {
    switch (s) {
      case 'Delivered':
        return 'state-delivered';
      case 'Shipped':
        return 'state-shipped';
      case 'Cancelled':
        return 'state-cancelled';
      case 'Processing':
        return 'state-processing';
      default:
        return 'state-open';
    }
  };
</script>

<svelte:head>
  <title>Sales History</title>
  <meta name="description" content="Your past sales" />
</svelte:head>

<header>
  <h1>Sales History</h1>
</header>

<main>
  {#if !data.isSeller}
    <p>Only seller accounts have sales history. </p>
  {:else if data.error}
    <p class="error">Error loading your sales: {data.error}</p>
  {:else if data.orders.length === 0}
    <p>You haven't made any sales yet. <a href="/listings/new">Post listings</a> to get started.</p>
  {:else}
    {#each data.orders as order (order._id)}
      <section class="order">
        <div class="order-head">
          <div>
            <span class="order-id">Order #{order._id.slice(-8)}</span>
            {#if dateLabel(order.createdAt)}
              <span class="order-date"> · {dateLabel(order.createdAt)}</span>
            {/if}
          </div>
          <span class="state {stateClass(order.fulfillmentState)}">{order.fulfillmentState}</span>
        </div>

        <ul>
          {#each order.items as item (item._id)}
            <li>
              <span class="name">{item.name}</span>
              <span class="qty">× {item.quantity}</span>
              <span class="price">{money(item.price)}</span>
              <span class="line">{money(item.price * item.quantity)}</span>
            </li>
          {/each}
        </ul>

        <div class="order-foot">
          {#if order.shippingInfo}
            <span class="shipping">Ship to: {order.shippingInfo}</span>
          {/if}
          <p class="total">Total: <strong>{money(order.total)}</strong></p>
        </div>
      </section>
    {/each}
  {/if}
</main>

<style>
  header {
    padding: 1.5rem;
    background: #f1f5f9;
    border-radius: 0.5rem;
  }

  h1 {
    margin: 0;
  }

  main {
    margin-top: 1.5rem;
  }

  p {
    color: #475569;
  }

  .error {
    color: #b91c1c;
  }

  .order {
    background: #ffffff;
    border: 1px solid #e2e8f0;
    border-radius: 0.5rem;
    padding: 1rem 1.25rem;
    margin-bottom: 1rem;
  }

  .order-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    padding-bottom: 0.5rem;
    border-bottom: 1px solid #e2e8f0;
  }

  .order-id {
    font-weight: 700;
  }

  .order-date {
    color: #64748b;
    font-size: 0.9rem;
  }

  .state {
    font-size: 0.8rem;
    font-weight: 600;
    padding: 0.15rem 0.6rem;
    border-radius: 999px;
    text-transform: uppercase;
    letter-spacing: 0.03em;
  }

  .state-open {
    background: #fef9c3;
    color: #854d0e;
  }

  .state-processing {
    background: #dbeafe;
    color: #1e40af;
  }

  .state-shipped {
    background: #e0e7ff;
    color: #3730a3;
  }

  .state-delivered {
    background: #dcfce7;
    color: #166534;
  }

  .state-cancelled {
    background: #fee2e2;
    color: #991b1b;
  }

  ul {
    list-style: none;
    padding: 0;
    margin: 0.5rem 0;
  }

  li {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 0.5rem 0;
    border-bottom: 1px solid #f1f5f9;
  }

  .name {
    flex: 1;
    font-weight: 600;
  }

  .qty {
    color: #64748b;
  }

  .price {
    color: #64748b;
    min-width: 5rem;
    text-align: right;
  }

  .line {
    min-width: 6rem;
    text-align: right;
  }

  .order-foot {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    margin-top: 0.5rem;
  }

  .shipping {
    color: #64748b;
    font-size: 0.9rem;
  }

  .total {
    margin: 0;
    font-size: 1.1rem;
  }
</style>
