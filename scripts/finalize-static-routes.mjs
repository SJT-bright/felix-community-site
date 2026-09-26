import { copyFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const index = `${root}dist/index.html`;
const lab = `${root}dist/lab/index.html`;

await mkdir(`${root}dist/lab`, { recursive: true });
await copyFile(index, lab);
