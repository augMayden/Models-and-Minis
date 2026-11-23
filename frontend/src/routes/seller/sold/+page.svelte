<script>
  import { enhance } from '$app/forms';
  /**
   * @type {{
   *   data: {
   *     orders: Array<{
   *       _id: string,
   *       buyerName: string,
   *       items: Array<{ _id: string, listingId: string, name: string, price: number, quantity: number }>,
   *       total: number,
   *       fulfillmentState: string,
   *       shippingInfo: string,
   *       createdAt: string,
   *       refunds: Array<{ _id: string, orderItem: string, reason: string, status: string, decisionReason: string, createdAt: string }>
   *     }>,
   *     isSeller: boolean,
   *     error: string
   *   },
   *   form: null | { message: string }
   * }}
   */
  let { data, form } = $props();

  /** @param {number} n */
  const money = (n) => `$${Number(n ?? 0).toFixed(2)}`;

  /** @param {string} d */
  const dateLabel = (d) => {
    if (!d) return '';
    const date = new Date(d);
    return Number.isNaN(date.getTime()) ? '' : date.toLocaleString();
  };

  /**
   * Finds an order item's name for refund display.
   * @param {{ items: Array<{ _id: string, name: string }> }} order
   * @param {string} orderItemId
   */
  const itemName = (order, orderItemId) =>
    order.items.find((i) => i._id === orderItemId)?.name ?? 'an item';

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
    <p>Only seller accounts have sales history.</p>
  {:else if data.error}
    <p class="error">Error loading your sales: {data.error}</p>
  {:else if data.orders.length === 0}
    <p>You haven't made any sales yet. <a href="/listings/new">Post listings</a> to get started.</p>
  {:else}
    {#if form?.message}
      <p class="notice" role="status">{form.message}</p>
    {/if}

    {#each data.orders as order (order._id)}
      <section class="order">
        <div class="order-head">
          <div>
            <span class="order-id">Order #{order._id.slice(-8)}</span>
            {#if dateLabel(order.createdAt)}
              <span class="order-date"> · {dateLabel(order.createdAt)}</span>
            {/if}
            <div class="buyer-name">Buyer: <strong>{order.buyerName}</strong></div>
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

        {#if order.refunds.length > 0}
          <div class="refund-panel">
            {#each order.refunds as refund (refund._id)}
              <details class="refund-box" open={refund.status === 'Pending'}>
                <summary>
                  Review refund request
                  <span class="refund-state refund-{refund.status.toLowerCase()}">{refund.status}</span>
                </summary>
                <div class="refund-body">
                  <p class="refund-item">
                    <strong>{itemName(order, refund.orderItem)}</strong> — requested {dateLabel(refund.createdAt)}
                  </p>
                  <p class="refund-reason">"{refund.reason}"</p>
                  {#if refund.decisionReason}
                    <p class="refund-note">Note: {refund.decisionReason}</p>
                  {/if}
                  {#if refund.status === 'Pending'}
                    <div class="refund-actions">
                      <form method="POST" action="?/accept" use:enhance>
                        <input type="hidden" name="refundId" value={refund._id} />
                        <button type="submit" class="accept">Accept return</button>
                      </form>
                      <details class="escalate-box">
                        <summary>Request admin support</summary>
                        <form method="POST" action="?/escalate" use:enhance>
                          <input type="hidden" name="refundId" value={refund._id} />
                          <input
                            type="text"
                            name="note"
                            placeholder="Why do you need admin help? (optional)"
                            maxlength="300"
                          />
                          <button type="submit">Send to admin</button>
                        </form>
                      </details>
                    </div>
                  {:else if refund.status === 'NeedsAdmin'}
                    <p class="refund-waiting">An admin is reviewing this request.</p>
                  {/if}
                </div>
              </details>
            {/each}
          </div>
        {/if}

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
    align-items: flex-start;
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

  .buyer-name {
    margin-top: 0.25rem;
    font-size: 0.9rem;
    color: #334155;
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

  .notice {
    background: #dbeafe;
    color: #1e40af;
    border: 1px solid #93c5fd;
    border-radius: 0.5rem;
    padding: 0.75rem 1rem;
    margin: 0.5rem 0;
  }

  .refund-panel {
    margin-top: 0.75rem;
  }

  .refund-box {
    border: 1px solid #fde68a;
    background: #fffbeb;
    border-radius: 0.5rem;
    padding: 0.6rem 0.9rem;
    margin-bottom: 0.5rem;
  }

  .refund-box summary {
    cursor: pointer;
    font-weight: 600;
    color: #92400e;
    display: flex;
    align-items: center;
    gap: 0.6rem;
    user-select: none;
  }

  .refund-state {
    font-size: 0.72rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.03em;
    padding: 0.1rem 0.5rem;
    border-radius: 999px;
    background: #fef3c7;
    color: #92400e;
  }

  .refund-approved {
    background: #dcfce7;
    color: #166534;
  }

  .refund-needsadmin {
    background: #e0e7ff;
    color: #3730a3;
  }

  .refund-denied {
    background: #fee2e2;
    color: #991b1b;
  }

  .refund-body {
    margin-top: 0.6rem;
  }

  .refund-item {
    margin: 0 0 0.25rem;
  }

  .refund-reason {
    margin: 0 0 0.25rem;
    color: #475569;
    font-style: italic;
  }

  .refund-note,
  .refund-waiting {
    margin: 0 0 0.25rem;
    color: #64748b;
    font-size: 0.9rem;
  }

  .refund-actions {
    display: flex;
    align-items: flex-start;
    gap: 1rem;
    margin-top: 0.6rem;
    flex-wrap: wrap;
  }

  .refund-actions button {
    border: none;
    border-radius: 0.375rem;
    padding: 0.4rem 0.9rem;
    font-size: 0.9rem;
    cursor: pointer;
  }

  .refund-actions button.accept {
    background: #16a34a;
    color: #ffffff;
  }

  .refund-actions button.accept:hover {
    background: #15803d;
  }

  .escalate-box summary {
    cursor: pointer;
    color: #1d4ed8;
    font-size: 0.9rem;
    user-select: none;
  }

  .escalate-box form {
    margin-top: 0.5rem;
    display: flex;
    gap: 0.5rem;
  }

  .escalate-box input[type='text'] {
    flex: 1;
    min-width: 14rem;
    padding: 0.4rem 0.6rem;
    border: 1px solid #cbd5e1;
    border-radius: 0.375rem;
    font-size: 0.9rem;
  }

  .escalate-box button {
    background: #1d4ed8;
    color: #ffffff;
  }

  .escalate-box button:hover {
    background: #1e40af;
  }
</style>