
const kind = process.env.DB_KIND || 'sqlite';

if (!['sqlite', 'hana'].includes(kind)) {
    throw new Error(`Unsupported database: ${kind}`);
}

module.exports = kind === 'hana'
    ? require('./hanaRepository')
    : require('./sqliteRepository');
