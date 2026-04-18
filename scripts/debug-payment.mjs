import { getDatabase } from '../src/lib/db.js';
const db = await getDatabase();
const res = await db.execute({
  sql: 'SELECT * FROM payments WHERE external_id LIKE ?', 
  args: ['%12065247-1776475708-74107%']
});
console.log(res.rows);
