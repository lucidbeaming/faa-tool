declare global {
	namespace App {}
	interface Window {
		_paq?: Array<Array<string | number>>;
	}
}

export {};
