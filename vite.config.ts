import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vitest/config';
import { webSocketServer } from './backend/webSocketPluginVIte';


export default defineConfig({
	plugins: [sveltekit(), webSocketServer],
	test: {
		include: ['src/**/*.{test,spec}.{js,ts}']
	}
});
