import { runSql } from './lib.mjs'

const tables = await runSql(`
  select table_name from information_schema.tables
  where table_schema = 'public' and table_type = 'BASE TABLE'
  order by table_name;
`)
console.log('טבלאות public:', tables.map(t => t.table_name).join(', '))

for (const { table_name } of tables) {
  const cols = await runSql(`
    select column_name, data_type, is_nullable, column_default
    from information_schema.columns
    where table_schema='public' and table_name='${table_name}'
    order by ordinal_position;
  `)
  const [{ n }] = await runSql(`select count(*)::int as n from public."${table_name}";`)
  console.log(`\n=== ${table_name} (${n} שורות) ===`)
  for (const c of cols) console.log(`  ${c.column_name}: ${c.data_type}${c.is_nullable === 'NO' ? ' NOT NULL' : ''}${c.column_default ? ' default ' + c.column_default : ''}`)
}

const authCols = await runSql(`
  select column_name from information_schema.columns
  where table_schema='auth' and table_name='users' order by ordinal_position;
`)
console.log('\n=== auth.users columns ===\n ', authCols.map(c => c.column_name).join(', '))

const pwInfo = await runSql(`
  select count(*)::int as total,
         count(encrypted_password)::int as with_password,
         count(distinct substring(encrypted_password, 1, 4)) as hash_variants,
         min(substring(encrypted_password, 1, 7)) as sample_prefix
  from auth.users;
`)
console.log('\nסיסמאות:', JSON.stringify(pwInfo[0]))

const idents = await runSql(`select provider, count(*)::int as n from auth.identities group by provider;`)
console.log('providers:', JSON.stringify(idents))
