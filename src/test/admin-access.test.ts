import { describe,it,expect } from 'vitest'
import { matchesPassword } from '@/lib/admin-session.server'
describe('Server password comparison',()=>{
 it('accepts only the matching password',()=>expect(matchesPassword('test-only-value','test-only-value')).toBe(true))
 it('rejects an incorrect password even when its length differs',()=>expect(matchesPassword('wrong','test-only-value')).toBe(false))
})