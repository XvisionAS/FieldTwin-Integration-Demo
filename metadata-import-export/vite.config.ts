import { sveltekit } from '@sveltejs/kit/vite';
import type { UserConfig } from 'vite';
import mkcert from 'vite-plugin-mkcert'

const config: UserConfig = {
	server: { https: true },
	plugins: [sveltekit(), mkcert()]
};

export default config;