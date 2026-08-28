import { invoke } from '@forge/bridge';
import { wireSurface } from '../../src/frontend/wire-surface.js';

const root = document.querySelector<HTMLElement>('#app');
if (!root) throw new Error('Missing app root');
wireSurface(root, 'AWS Widgets settings', invoke);
