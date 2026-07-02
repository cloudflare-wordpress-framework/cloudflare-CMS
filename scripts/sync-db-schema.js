import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const userSchemaPath = path.resolve(__dirname, '../forms/user.schema.json');
const userSqlPath = path.resolve(__dirname, '../user_schema.sql');

const userSchemaContent = fs.readFileSync(userSchemaPath, 'utf-8');
const userSchema = JSON.parse(userSchemaContent);

let sql = `CREATE TABLE IF NOT EXISTS users (\n`;
const columns = [];

for (const [propName, propDetails] of Object.entries(userSchema.properties)) {
  let colSql = `  ${propName} `;

  // Determine SQL Type
  if (propName === 'id') {
      colSql += 'TEXT PRIMARY KEY';
  } else if (propDetails.type === 'string' && propDetails.format === 'date-time') {
      colSql += 'TIMESTAMP';
  } else if (propDetails.type === 'string' && propDetails.format === 'date') {
      colSql += 'DATE';
  } else {
      colSql += 'TEXT';
  }

  // Determine NOT NULL
  if (userSchema.required && userSchema.required.includes(propName) && propName !== 'id') {
      colSql += ' NOT NULL';
  }

  // Specific Constraints based on description (hacky but works for this simple case)
  if (propDetails.description && propDetails.description.includes('(Unique)')) {
      colSql += ' UNIQUE';
  }

  if (propName === 'created_at') {
      colSql += ' DEFAULT CURRENT_TIMESTAMP';
  }

  columns.push(colSql);
}

sql += columns.join(',\n');
sql += `\n);\n`;

fs.writeFileSync(userSqlPath, sql, 'utf-8');
console.log('Successfully generated user_schema.sql from forms/user.schema.json');
