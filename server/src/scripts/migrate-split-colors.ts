// Usage: npm run migrate:split-colors -w server [-- --dry-run]
// Back up first (mongodump), and stop the server while this runs.

import 'dotenv/config';
import { MongoClient } from 'mongodb';
import { ensureIndexes } from '../db.js';
import { migrateSplitColors } from '../migrations/split-colors.js';

const connectionString = process.env.CONNECTION_STRING;
if (!connectionString) {
    throw new Error('CONNECTION_STRING is not set. Copy server/.env.example to server/.env.');
}
const dbName = process.env.DB_NAME || 'colordatabase';
const dryRun = process.argv.includes('--dry-run');

const client = new MongoClient(connectionString);
try {
    await client.connect();
    const db = client.db(dbName);

    console.log(`${dryRun ? 'Dry run: no changes will be written' : 'Migrating'} (${dbName})\n`);
    const report = await migrateSplitColors(db, { dryRun });

    for (const { id, removed } of report.merged) {
        console.log(`merge     ${id}: removed ${removed} duplicate document(s)`);
    }
    for (const { id, dropped } of report.reshaped) {
        console.log(`reshape   ${id}${dropped.length ? `: dropped ${dropped.join(', ')}` : ''}`);
    }
    for (const { id, reason } of report.skipped) {
        console.log(`SKIPPED   ${id}: ${reason}`);
    }

    const would = dryRun ? 'would be ' : '';
    console.log(
        `\n${report.songsScanned} song document(s) scanned; ` +
            `${report.converted.length} song(s) ${would}converted, ` +
            `${report.colorsCreated} color entr${report.colorsCreated === 1 ? 'y' : 'ies'} ${would}created, ` +
            `${report.merged.length} duplicate group(s) ${would}merged, ` +
            `${report.skipped.length} skipped.`,
    );

    if (!dryRun) {
        await ensureIndexes(db);
        console.log('Indexes are in place.');
    }
    if (report.skipped.length) {
        console.error('\nSkipped songs were left unchanged. Fix them by hand and rerun.');
        process.exitCode = 1;
    }
} finally {
    await client.close();
}
