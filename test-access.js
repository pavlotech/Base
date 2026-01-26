// Quick test of access control logic (simplified)
const allowedRoleIds = ['1295827280177795143', '1330842655302746174'];

function checkUserPermissions(hasAdmin, userRoles) {
    // Allow administrators
    if (hasAdmin) {
        return true;
    }

    // Check for specific roles
    const hasAllowedRole = userRoles.some(roleId =>
        allowedRoleIds.includes(roleId)
    );

    return hasAllowedRole;
}

console.log('Testing Access Control Logic:\n');

// Test cases
const testCases = [
    { name: 'Admin user', hasAdmin: true, roles: [], expected: true },
    { name: 'User with role 1295827280177795143', hasAdmin: false, roles: ['1295827280177795143'], expected: true },
    { name: 'User with role 1330842655302746174', hasAdmin: false, roles: ['1330842655302746174'], expected: true },
    { name: 'User with both roles', hasAdmin: false, roles: ['1295827280177795143', '1330842655302746174'], expected: true },
    { name: 'User with wrong role', hasAdmin: false, roles: ['123456789'], expected: false },
    { name: 'User with no roles', hasAdmin: false, roles: [], expected: false },
    { name: 'Regular user with other roles', hasAdmin: false, roles: ['999999999', '888888888'], expected: false }
];

testCases.forEach(test => {
    const result = checkUserPermissions(test.hasAdmin, test.roles);
    const status = result === test.expected ? '✅ PASS' : '❌ FAIL';
    console.log(`${status} ${test.name}`);
    console.log(`   Admin: ${test.hasAdmin}, Roles: [${test.roles.join(', ')}]`);
    console.log(`   Expected: ${test.expected}, Got: ${result}\n`);
});

console.log('✅ Access control testing complete!');
