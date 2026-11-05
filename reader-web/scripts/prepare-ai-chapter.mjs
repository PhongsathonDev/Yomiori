import { runCLI } from './conversion-pipeline.mjs';
runCLI(['inspect', ...process.argv.slice(2)]).catch(error => { console.error(error.message); process.exitCode = 1; });
