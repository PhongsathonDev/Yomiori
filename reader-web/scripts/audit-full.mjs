import { runCLI } from './conversion-pipeline.mjs';
runCLI(['audit', ...process.argv.slice(2)]).catch(error => { console.error(error.message); process.exitCode = 1; });
