import { runCLI } from './conversion-pipeline.mjs';
// No default speaker, invented roster entry, replacement prose or slice(1) check.
runCLI(['apply', ...process.argv.slice(2)]).catch(error => { console.error(error.message); process.exitCode = 1; });
