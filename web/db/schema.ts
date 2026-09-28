// Intentionally empty by default.
// Add Drizzle tables here when the site actually needs a database.
// See examples/d1/db/schema.ts for an opt-in example.
import { sqliteTable, text, integer, uniqueIndex, index } from 'drizzle-orm/sqlite-core';
export const rooms = sqliteTable('rooms', {
  id:text('id').primaryKey(), hostHash:text('host_hash').notNull(), pairHash:text('pair_hash'), codeHash:text('code_hash'), phoneHash:text('phone_hash'), expires:integer('expires').notNull()
}, t => [index('rooms_expiry').on(t.expires),uniqueIndex('rooms_code').on(t.codeHash)]);
export const signals = sqliteTable('signals', {
  id:integer('id').primaryKey({autoIncrement:true}), room:text('room').notNull(), sender:text('sender').notNull(), payload:text('payload').notNull()
}, t => [uniqueIndex('signals_room_sender').on(t.room,t.sender)]);
export const limits = sqliteTable('limits', {key:text('key').primaryKey(), count:integer('count').notNull(), expires:integer('expires').notNull()}, t => [index('limits_expiry').on(t.expires)]);
