export { matchers } from './matchers.js';

export const nodes = [
	() => import('./nodes/0'),
	() => import('./nodes/1'),
	() => import('./nodes/2'),
	() => import('./nodes/3'),
	() => import('./nodes/4'),
	() => import('./nodes/5'),
	() => import('./nodes/6'),
	() => import('./nodes/7')
];

export const server_loads = [0];

export const dictionary = {
		"/": [2],
		"/buyer/cart": [~3],
		"/login": [~4],
		"/register": [~5],
		"/seller/listings": [~6],
		"/users": [~7]
	};

export const hooks = {
	handleError: (({ kind, error }) => { if (kind === 'unknown') { console.error(error); } }),
	
	reroute: (() => {}),
	transport: {}
};

export const decoders = Object.fromEntries(Object.entries(hooks.transport).map(([k, v]) => [k, v.decode]));
export const encoders = Object.fromEntries(Object.entries(hooks.transport).map(([k, v]) => [k, v.encode]));

export const hash = false;

export const decode = (type, value) => decoders[type](value);

export const get_error_template = () => import('../shared/error-template.js').then(m => m.default);