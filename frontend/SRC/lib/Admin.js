const BASE_URL = 'https://db.msuscb.duckdns.org/api/admin/accounts'; 

// Helper function used by all Admin API requests
/**
 * 
 * @param {string} path 
 * @param {string} token 
 * @param {string} [method]
 * @param {Object} [body] 
 */

async function adminRequest(path, token, method = "GET", body = undefined) {

  const response = await fetch(`${BASE_URL}${path}`, {

    method: method,

    headers: {

      Authorization: `Bearer ${token}`,

      "Content-Type": "application/json"

    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {})
  });

  // Read the response if the server returned JSON

  const text = await response.text();

  const data = text ? JSON.parse(text) : null;

  if (!response.ok) {

    throw new Error(

      data?.message || `Request failed: ${response.status}`

    );

  }

  return data;

}

// 1. Get site overview
/**
 * @param {string} token
 */
export async function getSiteOverview(token) {

  return adminRequest("/api/admin/overview", token);

}

// 2. Get all user accounts
/**
 * @param {string} token  
 */
export async function getAccounts(token) {

  return adminRequest("/api/admin/accounts", token);

}

// 3. Approve an account
/**
 * @param {string} token 
 * @param {string} accountId  
 */
export async function approveAccount(token, accountId) {

  return adminRequest(

    `/api/admin/accounts/${encodeURIComponent(accountId)}/approve`,

    token,

    "POST"

  );

}

// 4. Deny an account
/**
 * @param {string} token 
 * @param {string} accountId  
 */
export async function denyAccount(token, accountId) {

  return adminRequest(

    `/api/admin/accounts/${encodeURIComponent(accountId)}/deny`,

    token,

    "POST"

  );

}

// 5. Ban an account
/**
 * @param {string} token 
 * @param {string} accountId  
 */
export async function banAccount(token, accountId) {

  return adminRequest(

    `/api/admin/accounts/${encodeURIComponent(accountId)}/ban`,

    token,

    "POST"

  );

}

// 6. Get listings, optionally filtered by status
/**
 * @param {string} token 
 * @param {string} status  
 */
export async function getListings(token, status) {

  const query = status

    ? `?status=${encodeURIComponent(status)}`

    : "";

  return adminRequest(

    `/api/admin/listings${query}`,

    token

  );

}

// 7. Approve a listing
/**
 * @param {string} token 
 * @param {string} listingId  
 */
export async function approveListing(token, listingId) {

  return adminRequest(

    `/api/admin/listings/${encodeURIComponent(listingId)}/approve`,

    token,

    "POST"

  );

}
/**
 * @param {string} token 
 * @param {string} id  
 * @param {Object} updates  
 */
export function updateListing(token, id, updates) {
    return adminRequest(
        `/api/listings/${encodeURIComponent(id)}`,
        token,
        "PATCH",
        updates
    );
}
/**
 * @param {string} token 
 * @param {string} id  
 */
export function removeListing(token, id) {
    return adminRequest(
        `/api/listings/${encodeURIComponent(id)}`,
        token,
        "DELETE"
    );
}
/**
 * @param {string} token 
 * @param {string} id  
 */
export function getOrderById(token, id) {
    return adminRequest(
        `/api/orders/${encodeURIComponent(id)}`,
        token
    );
}
/**
 * @param {string} token 
 * @param {string} id
 * @param {{fulfillmentState?: string, shippingInfo?: string}} updates  
 */
export function updateOrderFulfillment(token, id, updates) {
    return adminRequest(
        `/api/orders/${encodeURIComponent(id)}`,
        token,
        "PATCH",
        updates
    );
}