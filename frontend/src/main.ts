import '@fontsource-variable/bricolage-grotesque/opsz.css';
import { mount } from 'svelte';
import { registerSW } from 'virtual:pwa-register';
import App from './App.svelte';
import './app.css';

// The service worker keeps the app and played samples for use with the Pi out of reach.
registerSW({ immediate: true });

export default mount(App, { target: document.getElementById('app')! });
