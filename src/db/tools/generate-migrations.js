const execSync = require('child_process').execSync

const arg = process.argv[2]

if(!arg) throw new Error('Pass the name for migration')

const command = `typeorm-ts-node-esm migration:generate -d ./src/db/data-source.ts ./src/db/migrations/${arg}`

execSync(command, {stdio: 'inherit'})