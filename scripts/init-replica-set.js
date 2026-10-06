const { MongoClient } = require('mongodb');

async function main() {
  const client = new MongoClient('mongodb://127.0.0.1:27017/?directConnection=true');
  await client.connect();
  const admin = client.db('admin');
  try {
    const status = await admin.command({ replSetGetStatus: 1 });
    console.log('Replica set already initiated:', status.set);
  } catch (err) {
    const result = await admin.command({
      replSetInitiate: {
        _id: 'rs0',
        members: [{ _id: 0, host: '127.0.0.1:27017' }],
      },
    });
    console.log('Initiated:', JSON.stringify(result));
  }
  await client.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
