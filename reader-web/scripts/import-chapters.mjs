#!/usr/bin/env node
// Status never equates a local file with live CDN data.
import { runCLI } from './conversion-pipeline.mjs';
const command = { '--status': 'status', '-s': 'status', '--audit': 'audit', '-a': 'audit' }[process.argv[2] ?? '--status'];
if (!command) { console.error('Use --status or --audit followed by a novel ID'); process.exitCode = 1; }
else runCLI([command, '--novel', process.argv[3] ?? 'kyudo-senpai']).catch(error => { console.error(error.message); process.exitCode = 1; });
