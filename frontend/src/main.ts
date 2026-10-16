import '@fontsource-variable/bricolage-grotesque/opsz.css';
import { mount } from 'svelte';
import App from './App.svelte';
import './app.css';

export default mount(App, { target: document.getElementById('app')! });
