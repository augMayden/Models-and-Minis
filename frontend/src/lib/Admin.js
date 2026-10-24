const BASE_URL = 'https://db.msuscb.duckdns.org';

/**
 * @param {string} path
 * @param {string} token
 * @param {string} [method]
 * @param {Object} [body]
 */
async function adminRequest(path, token, method = 'GET', body = undefined) {
  const headers = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json'
  };

  /** @type {RequestInit} */
  const options = { method, headers };

  if (body !== undefined) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(`${BASE_URL}${path}`, options);

  const text = await response.text();
  let data = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = null;
    }
  }

  if (!response.ok) {
    throw new Error(
      data?.message || data?.error || `Request failed: ${response.status}`
    );
  }

  return data;
}

/**
 * @param {string} token
 * @param {string} path
 * @param {string} id
 * @param {string} label
 */
async function mutateAndRequireResult(token, path, id, label) {
  const result = await adminRequest(path, token, 'POST');

  if (result === null || result === undefined) {
    throw new Error(`No matching ${label} found for that ID.`);
  }

  return result;
}

/** @param {string} token */
export async function getSiteOverview(token) {
  return adminRequest('/api/admin/overview', token);
}

/** @param {string} token */
export async function getAccounts(token) {
  return adminRequest('/api/admin/accounts', token);
}

/**
 * @param {string} token
 * @param {string} accountId
 */
export async function approveAccount(token, accountId) {
  return mutateAndRequireResult(
    token,
    `/api/admin/accounts/${encodeURIComponent(accountId)}/approve`,
    accountId,
    'account'
  );
}

/**
 * @param {string} token
 * @param {string} accountId
 */
export async function denyAccount(token, accountId) {
  return mutateAndRequireResult(
    token,
    `/api/admin/accounts/${encodeURIComponent(accountId)}/deny`,
    accountId,
    'account'
  );
}

/**
 * @param {string} token
 * @param {string} accountId
 */
export async function banAccount(token, accountId) {
  return mutateAndRequireResult(
    token,
    `/api/admin/accounts/${encodeURIComponent(accountId)}/ban`,
    accountId,
    'account'
  );
}

/**
 * @param {string} token
 * @param {string} [status]
 */
export async function getListings(token, status) {
  const query = status ? `?status=${encodeURIComponent(status)}` : '';
  return adminRequest(`/api/admin/listings${query}`, token);
}

/**
 * @param {string} token
 * @param {string} listingId
 */
export async function approveListing(token, listingId) {
  return mutateAndRequireResult(
    token,
    `/api/admin/listings/${encodeURIComponent(listingId)}/approve`,
    listingId,
    'listing'
  );
}

/**
 * @param {string} token
 * @param {string} id
 * @param {Object} updates
 */
export function updateListing(token, id, updates) {
  return adminRequest(`/api/listings/${encodeURIComponent(id)}`, token, 'PATCH', updates);
}

/**
 * @param {string} token
 * @param {string} id
 */
export function removeListing(token, id) {
  return adminRequest(`/api/listings/${encodeURIComponent(id)}`, token, 'DELETE');
}

/**
 * @param {string} token
 * @param {string} id
 */
export function getOrderById(token, id) {
  return adminRequest(`/api/orders/${encodeURIComponent(id)}`, token);
}

/**
 * @param {string} token
 * @param {string} id
 * @param {{fulfillmentState?: string, shippingInfo?: string}} updates
 */
export function updateOrderFulfillment(token, id, updates) {
  return adminRequest(`/api/orders/${encodeURIComponent(id)}`, token, 'PATCH', updates);
}
