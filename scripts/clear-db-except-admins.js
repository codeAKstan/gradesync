import 'dotenv/config'

// Import clientPromise after env variables are loaded
const { default: clientPromise } = await import('../lib/mongodb.js')

async function run() {
  try {
    const client = await clientPromise
    const db = client.db('gradesynce')

    console.log('Connected to database:', db.databaseName)

    const collections = await db.listCollections().toArray()
    const preserve = new Set(['admins'])

    const results = []

    for (const col of collections) {
      const name = col.name
      if (preserve.has(name)) {
        console.log(`Skipping collection '${name}' (preserved)`) 
        continue
      }

      const collection = db.collection(name)
      const beforeCount = await collection.estimatedDocumentCount()
      const deleteResult = await collection.deleteMany({})
      results.push({
        collection: name,
        before: beforeCount,
        deleted: deleteResult.deletedCount ?? 0
      })
      console.log(`Cleared ${deleteResult.deletedCount ?? 0} documents from '${name}' (was ${beforeCount})`)
    }

    const adminCount = await db.collection('admins').estimatedDocumentCount()
    console.log(`Admins collection intact. Document count: ${adminCount}`)

    console.log('\nSummary:')
    for (const r of results) {
      console.log(`- ${r.collection}: deleted ${r.deleted}/${r.before}`)
    }

    process.exit(0)
  } catch (err) {
    console.error('Cleanup failed:', err)
    process.exit(1)
  }
}

run()