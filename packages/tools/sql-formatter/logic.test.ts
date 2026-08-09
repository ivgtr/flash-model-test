import { describe, expect, it } from 'vitest'
import { formatSql } from './logic'

describe('formatSql', () => {
  it('formats a basic SELECT with clause line breaks, indentation, and uppercased keywords', () => {
    const result = formatSql('select id, name from users where id = 1')
    expect(result).toEqual({
      ok: true,
      output: ['SELECT', '  id,', '  name', 'FROM', '  users', 'WHERE', '  id = 1'].join('\n'),
    })
  })

  it('keeps string literals and comments untouched', () => {
    const result = formatSql(
      "select 'select from where' as literal, 'it''s' as q from t /* keep from */ where id = 1",
    )
    expect(result).toEqual({
      ok: true,
      output: [
        'SELECT',
        "  'select from where' AS literal,",
        "  'it''s' AS q",
        'FROM',
        '  t /* keep from */',
        'WHERE',
        '  id = 1',
      ].join('\n'),
    })
  })

  it('does not uppercase or split keywords inside string literals', () => {
    const result = formatSql(`select "SELECT from" as quoted from t`)
    expect(result).toEqual({
      ok: true,
      output: ['SELECT', '  "SELECT from" AS quoted', 'FROM', '  t'].join('\n'),
    })
  })

  it('handles escaped quotes with doubled quotes and backslash escapes', () => {
    const doubled = formatSql(`select 'it''s' as a, "say ""hi""" as b from t`)
    expect(doubled).toEqual({
      ok: true,
      output: ['SELECT', `  'it''s' AS a,`, `  "say ""hi""" AS b`, 'FROM', '  t'].join('\n'),
    })
    const backslash = formatSql(`select 'it\\'s ok' from t`)
    expect(backslash).toEqual({
      ok: true,
      output: ['SELECT', "  'it\\'s ok'", 'FROM', '  t'].join('\n'),
    })
  })

  it('formats JOIN / WHERE / GROUP BY / ORDER BY', () => {
    const result = formatSql(
      'select u.id, u.name from users u inner join orders o on o.user_id = u.id where o.total > 10 group by u.id order by u.id desc',
    )
    expect(result).toEqual({
      ok: true,
      output: [
        'SELECT',
        '  u.id,',
        '  u.name',
        'FROM',
        '  users u',
        '  INNER JOIN orders o',
        '  ON o.user_id = u.id',
        'WHERE',
        '  o.total > 10',
        'GROUP BY',
        '  u.id',
        'ORDER BY',
        '  u.id desc',
      ].join('\n'),
    })
  })

  it('keeps commas trailing instead of leading', () => {
    const result = formatSql('select a, b, c from t')
    expect(result).toEqual({
      ok: true,
      output: ['SELECT', '  a,', '  b,', '  c', 'FROM', '  t'].join('\n'),
    })
  })

  it('formats INSERT INTO ... VALUES with one row per line', () => {
    const result = formatSql("insert into users (name, age) values ('Alice', 30), ('Bob', 25);")
    expect(result).toEqual({
      ok: true,
      output: [
        'INSERT INTO',
        '  users(name, age)',
        'VALUES',
        "  ('Alice', 30),",
        "  ('Bob', 25);",
      ].join('\n'),
    })
  })

  it('formats DELETE FROM and UPDATE ... SET', () => {
    expect(formatSql('delete from users where id = 1')).toEqual({
      ok: true,
      output: ['DELETE FROM', '  users', 'WHERE', '  id = 1'].join('\n'),
    })
    expect(formatSql("update users set name = 'Alice' where id = 1")).toEqual({
      ok: true,
      output: ['UPDATE', '  users', 'SET', "  name = 'Alice'", 'WHERE', '  id = 1'].join('\n'),
    })
  })

  it('separates multiple statements with newlines', () => {
    const result = formatSql('select 1; select 2; select 3')
    expect(result).toEqual({
      ok: true,
      output: ['SELECT', '  1;', 'SELECT', '  2;', 'SELECT', '  3'].join('\n'),
    })
  })

  it('reports an error for empty input', () => {
    expect(formatSql('')).toEqual({ ok: false, error: 'Input is empty.' })
    expect(formatSql('  \n\t ')).toEqual({ ok: false, error: 'Input is empty.' })
    expect(formatSql(';;')).toEqual({ ok: false, error: 'Input is empty.' })
  })

  it('passes through unrecognized and dialect syntax unchanged', () => {
    const result = formatSql('select [column] from "my table"')
    expect(result).toEqual({
      ok: true,
      output: ['SELECT', '  [column]', 'FROM', '  "my table"'].join('\n'),
    })
    const dialect = formatSql('select top 10 * from t')
    expect(dialect).toEqual({
      ok: true,
      output: ['SELECT', '  top 10 *', 'FROM', '  t'].join('\n'),
    })
  })

  it('indents subqueries by one extra level', () => {
    const result = formatSql(
      'select id from users where id in (select user_id from orders where total > 100)',
    )
    expect(result).toEqual({
      ok: true,
      output: [
        'SELECT',
        '  id',
        'FROM',
        '  users',
        'WHERE',
        '  id IN (',
        '    SELECT',
        '      user_id',
        '    FROM',
        '      orders',
        '    WHERE',
        '      total > 100',
        '  )',
      ].join('\n'),
    })
  })

  it('uppercases CASE / WHEN / THEN / ELSE / END without adding line breaks', () => {
    const result = formatSql("select case when x = 1 then 'a' else 'b' end as c from t")
    expect(result).toEqual({
      ok: true,
      output: ['SELECT', "  CASE WHEN x = 1 THEN 'a' ELSE 'b' END AS c", 'FROM', '  t'].join('\n'),
    })
  })

  it('formats UNION queries', () => {
    const result = formatSql('select a from t union all select b from u')
    expect(result).toEqual({
      ok: true,
      output: ['SELECT', '  a', 'FROM', '  t', 'UNION all', 'SELECT', '  b', 'FROM', '  u'].join(
        '\n',
      ),
    })
  })

  it('handles LIMIT and OFFSET inline', () => {
    const result = formatSql('select id from t limit 5 offset 2')
    expect(result).toEqual({
      ok: true,
      output: ['SELECT', '  id', 'FROM', '  t', 'LIMIT 5', 'OFFSET 2'].join('\n'),
    })
  })

  it('does not split commas inside parenthesized expressions or function calls', () => {
    const result = formatSql('select count(a, b), (x + y) as s from t')
    expect(result).toEqual({
      ok: true,
      output: ['SELECT', '  count(a, b),', '  (x + y) AS s', 'FROM', '  t'].join('\n'),
    })
  })

  it('reports an error for an unterminated string literal', () => {
    const result = formatSql("select 'oops from t")
    expect(result).toEqual({ ok: false, error: 'Unterminated string literal.' })
  })

  it('reports an error for an unterminated block comment', () => {
    const result = formatSql('select 1 /* oops')
    expect(result).toEqual({ ok: false, error: 'Unterminated block comment.' })
  })

  it('reports an error for unbalanced parentheses', () => {
    expect(formatSql('select (1')).toEqual({ ok: false, error: 'Unclosed parenthesis.' })
    expect(formatSql('select 1)')).toEqual({ ok: false, error: 'Unexpected closing parenthesis.' })
  })
})
