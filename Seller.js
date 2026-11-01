const BASE_URL = "http://127.0.0.1:4000";



// Helper function for Seller API requests

async function sellerRequest(path, token, method = "GET", body = null) {

    const headers = {

        Authorization: `Bearer ${token}`

    };



    const options = {

        method,

        headers

    };



    if (body !== null) {

        headers["Content-Type"] = "application/json";

        options.body = JSON.stringify(body);

    }



    const response = await fetch(`${BASE_URL}${path}`, options);



    const data = await response.json().catch(() => null);



    if (!response.ok) {

        throw new Error(data?.message || `Request failed: ${response.status}`);

    }



    return data;

}



// Create a listing

export function createListing(token, listing) {

    return sellerRequest("/api/listings", token, "POST", listing);

}



// Update a listing

export function updateListing(token, id, updates) {

    return sellerRequest(

        `/api/listings/${encodeURIComponent(id)}`,

        token,

        "PATCH",

        updates

    );

}



// Remove a listing

export function removeListing(token, id) {

    return sellerRequest(

        `/api/listings/${encodeURIComponent(id)}`,

        token,

        "DELETE"

    );

}



// Get orders containing the seller's items

export function getSellerOrders(token) {

    return sellerRequest("/api/orders", token);

}



// Get a specific order

export function getOrderById(token, id) {

    return sellerRequest(

        `/api/orders/${encodeURIComponent(id)}`,

        token

    );

}



// Update order fulfillment and shipping information

export function updateOrderFulfillment(token, id, updates) {

    return sellerRequest(

        `/api/orders/${encodeURIComponent(id)}`,

        token,

        "PATCH",

        updates

    );

}