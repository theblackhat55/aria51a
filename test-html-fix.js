// Test script to verify HTML entity escaping fix
// This simulates the user management table generation logic

const sampleUsers = [
  {
    id: 1,
    email: 'admin@aria5.com',
    first_name: 'Admin',
    last_name: 'User',
    role: 'admin',
    is_active: true,
    last_login: '2025-01-15T10:30:00Z'
  },
  {
    id: 2,
    email: 'avi@aria5.com',
    first_name: 'Avi',
    last_name: 'Security',
    role: 'risk_manager',
    is_active: true,
    last_login: '2025-01-14T15:45:00Z'
  },
  {
    id: 3,
    email: 'sjohnson@aria5.com',
    first_name: 'Sarah',
    last_name: 'Johnson',
    role: 'compliance_officer',
    is_active: true,
    last_login: null
  }
];

// Test the same logic used in the fixed code
const userTableRows = sampleUsers.map((u) => {
  const roleColor = u.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                   u.role === 'risk_manager' ? 'bg-blue-100 text-blue-800' :
                   u.role === 'compliance_officer' ? 'bg-green-100 text-green-800' :
                   'bg-gray-100 text-gray-800';
  
  const statusColor = u.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
  const statusText = u.is_active ? 'Active' : 'Inactive';
  const actionColor = u.is_active ? 'red' : 'green';
  const actionIcon = u.is_active ? 'ban' : 'check';
  const actionText = u.is_active ? 'Disable' : 'Enable';
  const fullName = (u.first_name || '') + ' ' + (u.last_name || '');
  const lastLogin = u.last_login ? new Date(u.last_login).toLocaleDateString() : 'Never';
  const roleDisplay = u.role.replace('_', ' ').toUpperCase();
  
  // Using the fixed approach: raw string concatenation instead of template literals
  return '<tr class="hover:bg-gray-50">' +
    '<td class="px-6 py-4 whitespace-nowrap">' +
      '<div class="flex items-center">' +
        '<div class="flex-shrink-0 h-10 w-10">' +
          '<div class="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">' +
            '<i class="fas fa-user text-gray-500"></i>' +
          '</div>' +
        '</div>' +
        '<div class="ml-4">' +
          '<div class="text-sm font-medium text-gray-900">' + fullName + '</div>' +
          '<div class="text-sm text-gray-500">' + u.email + '</div>' +
        '</div>' +
      '</div>' +
    '</td>' +
    '<td class="px-6 py-4 whitespace-nowrap">' +
      '<span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full ' + roleColor + '">' +
        roleDisplay +
      '</span>' +
    '</td>' +
    '<td class="px-6 py-4 whitespace-nowrap">' +
      '<span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full ' + statusColor + '">' +
        statusText +
      '</span>' +
    '</td>' +
    '<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">' + lastLogin + '</td>' +
    '<td class="px-6 py-4 whitespace-nowrap text-sm font-medium">' +
      '<button onclick="editUser(' + u.id + ')" class="text-blue-600 hover:text-blue-900 mr-3">' +
        '<i class="fas fa-edit"></i> Edit' +
      '</button>' +
      '<button onclick="toggleUser(' + u.id + ', ' + !u.is_active + ')" class="text-' + actionColor + '-600 hover:text-' + actionColor + '-900">' +
        '<i class="fas fa-' + actionIcon + '"></i> ' + actionText +
      '</button>' +
    '</td>' +
  '</tr>';
}).join('');

// Generate complete table HTML
const tableHTML = `
<!DOCTYPE html>
<html>
<head>
    <title>HTML Fix Test</title>
    <style>
        table { border-collapse: collapse; width: 100%; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
        .hover\\:bg-gray-50:hover { background-color: #f9fafb; }
    </style>
</head>
<body>
    <h1>User Management Table - HTML Escaping Test</h1>
    <p><strong>Expected:</strong> Clean HTML table with proper rendering</p>
    <p><strong>Problem (before fix):</strong> HTML entities like &amp;lt;tr&amp;gt; instead of &lt;tr&gt;</p>
    
    <table class="min-w-full divide-y divide-gray-200">
        <thead class="bg-gray-50">
            <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Login</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-200">
            ${userTableRows}
        </tbody>
    </table>
    
    <h2>Raw HTML Output (for verification):</h2>
    <pre style="background: #f5f5f5; padding: 10px; overflow-x: auto; font-size: 12px;">
${userTableRows.replace(/</g, '&lt;').replace(/>/g, '&gt;')}
    </pre>
</body>
</html>
`;

console.log('Generated HTML Table:');
console.log(tableHTML);

// Write to file for inspection
require('fs').writeFileSync('/home/user/webapp/test-output.html', tableHTML);
console.log('\nHTML test file written to: /home/user/webapp/test-output.html');
console.log('\nTo inspect: Open the file in a browser to verify HTML renders correctly');
console.log('Expected: Clean table with proper HTML structure');
console.log('Problem if exists: HTML entities visible instead of rendered HTML');