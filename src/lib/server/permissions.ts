import { createAccessControl } from 'better-auth/plugins/access';
import { defaultStatements, adminAc } from 'better-auth/plugins/admin/access';

const statement = {
	...defaultStatements,
	...adminAc.statements
} as const;

const ac = createAccessControl(statement);

export const user = ac.newRole({
	user: [],
	session: []
});

export const admin = ac.newRole({
	user: ['create', 'list', 'ban', 'set-role', 'delete', 'set-password'],
	session: ['list', 'revoke']
});

export const superadmin = ac.newRole({
	user: ['create', 'list', 'ban', 'impersonate', 'delete', 'set-role', 'set-password'],
	session: ['list', 'revoke']
});

export { ac };
