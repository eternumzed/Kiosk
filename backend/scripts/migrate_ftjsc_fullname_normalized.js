const path = require('path');
const mongoose = require('mongoose');

require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const { dbMain } = require('../config/db');
const Request = require('../models/requestSchema');

function normalizeFullName(value) {
  if (typeof value !== 'string') return '';
  return value.trim().replace(/\s+/g, ' ').toLowerCase();
}

function parseArgs(argv) {
  return {
    apply: argv.includes('--apply'),
    createIndex: argv.includes('--create-index'),
    help: argv.includes('--help') || argv.includes('-h'),
  };
}

function printHelp() {
  console.log('Usage: node scripts/migrate_ftjsc_fullname_normalized.js [--apply] [--create-index]');
  console.log('');
  console.log('Options:');
  console.log('  --apply         Apply fullNameNormalized backfill updates');
  console.log('  --create-index  Create partial unique FTJSC index after successful backfill and zero active duplicates');
  console.log('  -h, --help      Show this help message');
  console.log('');
  console.log('Examples:');
  console.log('  npm run migrate:ftjsc-fullname');
  console.log('  npm run migrate:ftjsc-fullname -- --apply');
  console.log('  npm run migrate:ftjsc-fullname -- --apply --create-index');
}

function isActiveFtjsc(doc) {
  return doc.documentCode === 'FTJSC' && doc.deleted !== true && doc.status !== 'Cancelled';
}

async function backfillAndAudit({ apply }) {
  const cursor = Request.find(
    { documentCode: 'FTJSC' },
    { _id: 1, referenceNumber: 1, fullName: 1, fullNameNormalized: 1, status: 1, deleted: 1 }
  ).cursor();

  const bulkOps = [];
  const duplicates = new Map();

  let scanned = 0;
  let needsUpdate = 0;

  for await (const doc of cursor) {
    scanned += 1;

    const normalized = normalizeFullName(doc.fullName);
    const current = typeof doc.fullNameNormalized === 'string' ? doc.fullNameNormalized : '';

    if (normalized !== current) {
      needsUpdate += 1;
      if (apply) {
        bulkOps.push({
          updateOne: {
            filter: { _id: doc._id },
            update: { $set: { fullNameNormalized: normalized } },
          },
        });
      }
    }

    if (isActiveFtjsc(doc) && normalized) {
      if (!duplicates.has(normalized)) duplicates.set(normalized, []);
      duplicates.get(normalized).push({
        _id: String(doc._id),
        referenceNumber: doc.referenceNumber || '',
        fullName: doc.fullName || '',
      });
    }
  }

  if (apply && bulkOps.length > 0) {
    const chunkSize = 500;
    for (let i = 0; i < bulkOps.length; i += chunkSize) {
      const chunk = bulkOps.slice(i, i + chunkSize);
      await Request.bulkWrite(chunk, { ordered: false });
    }
  }

  const duplicateGroups = [];
  for (const [normalizedName, docs] of duplicates.entries()) {
    if (docs.length > 1) {
      duplicateGroups.push({ normalizedName, count: docs.length, docs });
    }
  }

  duplicateGroups.sort((a, b) => b.count - a.count);

  return {
    scanned,
    needsUpdate,
    updated: apply ? needsUpdate : 0,
    duplicateGroups,
  };
}

async function createUniqueIndex() {
  return Request.collection.createIndex(
    { documentCode: 1, fullNameNormalized: 1 },
    {
      name: 'uniq_ftjsc_active_full_name',
      unique: true,
      partialFilterExpression: {
        documentCode: 'FTJSC',
        status: { $in: ['Pending', 'Processing', 'For Pick-up', 'Completed'] },
        deleted: false,
        fullNameNormalized: { $exists: true, $type: 'string', $gt: '' },
      },
    }
  );
}

async function main() {
  const { apply, createIndex, help } = parseArgs(process.argv.slice(2));

  if (help) {
    printHelp();
    return;
  }

  console.log('FTJSC migration start');
  console.log(`Mode: ${apply ? 'APPLY' : 'DRY RUN'} | createIndex=${createIndex ? 'yes' : 'no'}`);

  await dbMain();

  const report = await backfillAndAudit({ apply });

  console.log(`Scanned FTJSC records: ${report.scanned}`);
  console.log(`Records needing fullNameNormalized backfill: ${report.needsUpdate}`);
  if (apply) {
    console.log(`Records updated: ${report.updated}`);
  }

  if (report.duplicateGroups.length > 0) {
    console.log(`Active duplicate normalized names found: ${report.duplicateGroups.length}`);
    report.duplicateGroups.slice(0, 50).forEach((group, idx) => {
      const refs = group.docs.map((d) => d.referenceNumber || d._id).join(', ');
      console.log(`${idx + 1}. ${group.normalizedName} (${group.count}) -> ${refs}`);
    });
  } else {
    console.log('No active duplicate normalized FTJSC names found.');
  }

  if (createIndex) {
    if (!apply) {
      throw new Error('Refusing to create unique index in DRY RUN mode. Re-run with --apply --create-index.');
    }
    if (report.duplicateGroups.length > 0) {
      throw new Error('Cannot create unique index while active duplicates still exist. Resolve duplicates first.');
    }

    const indexName = await createUniqueIndex();
    console.log(`Created/confirmed index: ${indexName}`);
    console.log('Schema now always declares this index; deploy normally after migration.');
  }

  await mongoose.connection.close();
  console.log('FTJSC migration complete');
}

main().catch(async (err) => {
  console.error('FTJSC migration failed:', err.message || err);
  try {
    await mongoose.connection.close();
  } catch (_err) {
    // no-op
  }
  process.exit(1);
});
