// empty during dev
export const immutable = [];
export const prerendered = [];

export const assets = [
	{"path":"robots.txt"}
];

export const routes = [
	{"id":"/","page":true,"endpoint":false},
	{"id":"/buyer/cart","page":true,"endpoint":false},
	{"id":"/buyer/orders","page":true,"endpoint":false},
	{"id":"/listings","page":true,"endpoint":false},
	{"id":"/listings/new","page":true,"endpoint":false},
	{"id":"/listings/[id]","page":true,"endpoint":false},
	{"id":"/login","page":true,"endpoint":false},
	{"id":"/logout","page":false,"endpoint":true},
	{"id":"/register","page":true,"endpoint":false},
	{"id":"/users","page":true,"endpoint":false},
	{"id":"/users/[id]","page":true,"endpoint":false}
];