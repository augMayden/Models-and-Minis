const BASE_URL = 'http://127.0.0.1:4000';

// Helper function used by all Admin API requests

async function adminRequest(path, token, method = "GET") {

  const response = await fetch(`${BASE_URL}${path}`, {

    method: method,

    headers: {

      Authorization: `Bearer ${token}`,

      "Content-Type": "application/json"

    }

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

export async function getSiteOverview(token) {

  return adminRequest("/api/admin/overview", token);

}

// 2. Get all user accounts

export async function getAccounts(token) {

  return adminRequest("/api/admin/accounts", token);

}

// 3. Approve an account

export async function approveAccount(token, accountId) {

  return adminRequest(

    `/api/admin/accounts/${encodeURIComponent(accountId)}/approve`,

    token,

    "POST"

  );

}

// 4. Deny an account

export async function denyAccount(token, accountId) {

  return adminRequest(

    `/api/admin/accounts/${encodeURIComponent(accountId)}/deny`,

    token,

    "POST"

  );

}

// 5. Ban an account

export async function banAccount(token, accountId) {

  return adminRequest(

    `/api/admin/accounts/${encodeURIComponent(accountId)}/ban`,

    token,

    "POST"

  );

}

// 6. Get listings, optionally filtered by status

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

export async function approveListing(token, listingId) {

  return adminRequest(

    `/api/admin/listings/${encodeURIComponent(listingId)}/approve`,

    token,

    "POST"

  );

}

export function updateListing(token, id, updates) {
    return adminRequest(
        `/api/listings/${encodeURIComponent(id)}`,
        token,
        "PATCH",
        updates
    );
}

export function removeListing(token, id) {
    return adminRequest(
        `/api/listings/${encodeURIComponent(id)}`,
        token,
        "DELETE"
    );
}

export function getOrderById(token, id) {
    return adminRequest(
        `/api/orders/${encodeURIComponent(id)}`,
        token
    );
}

export function updateOrderFulfillment(token, id, updates) {
    return adminRequest(
        `/api/orders/${encodeURIComponent(id)}`,
        token,
        "PATCH",
        updates
    );
}