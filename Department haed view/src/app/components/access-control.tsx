import { Shield, UserPlus, Users, Key } from 'lucide-react';

const adminUsers = [
  { name: 'Admin SuperUser', email: 'admin@apc.edu.ph', role: 'Super Admin', status: 'Active' },
  { name: 'John Santos', email: 'j.santos@apc.edu.ph', role: 'Admin', status: 'Active' },
  { name: 'Maria Cruz', email: 'm.cruz@apc.edu.ph', role: 'Admin', status: 'Active' },
  { name: 'Carlos Reyes', email: 'c.reyes@apc.edu.ph', role: 'Moderator', status: 'Active' },
  { name: 'Ana Lopez', email: 'a.lopez@apc.edu.ph', role: 'Moderator', status: 'Inactive' },
];

const rolePermissions = [
  { role: 'Super Admin', permissions: 'Full system access' },
  { role: 'Admin', permissions: 'Approve/reject events, manage users' },
  { role: 'Moderator', permissions: 'View analytics, send broadcasts' },
  { role: 'Viewer', permissions: 'Read-only access' },
];

export function AccessControl() {
  return (
    <div className="flex-1 p-8 overflow-y-auto">
      <div className="mb-8">
        <h2 className="text-3xl text-[#E8EBE9] mb-2">System Access Control</h2>
        <p className="text-[#9BA5A1]">Manage administrator accounts and permissions</p>
      </div>

      <div className="grid grid-cols-2 gap-6 mb-6">
        <div className="bg-[#284139] rounded-lg p-6 border border-[rgba(40,65,57,0.5)]">
          <div className="flex items-center gap-2 mb-4">
            <Shield className="w-5 h-5 text-[#BB6830]" />
            <h3 className="text-lg text-[#E8EBE9]">Role Permissions</h3>
          </div>

          <div className="space-y-3">
            {rolePermissions.map((item) => (
              <div key={item.role} className="p-4 bg-[#1F2D2A] rounded-lg">
                <div className="text-[#E8EBE9] text-sm font-medium mb-1">{item.role}</div>
                <div className="text-[#9BA5A1] text-xs">{item.permissions}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-[#284139] rounded-lg p-6 border border-[rgba(40,65,57,0.5)]">
          <div className="flex items-center gap-2 mb-4">
            <UserPlus className="w-5 h-5 text-[#BB6830]" />
            <h3 className="text-lg text-[#E8EBE9]">Add New Administrator</h3>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-sm text-[#9BA5A1] mb-2">Name</label>
              <input
                type="text"
                placeholder="Full name"
                className="w-full bg-[#1F2D2A] text-[#E8EBE9] px-4 py-2 rounded-lg border border-[rgba(40,65,57,0.5)] focus:border-[#BB6830] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm text-[#9BA5A1] mb-2">Email</label>
              <input
                type="email"
                placeholder="email@apc.edu.ph"
                className="w-full bg-[#1F2D2A] text-[#E8EBE9] px-4 py-2 rounded-lg border border-[rgba(40,65,57,0.5)] focus:border-[#BB6830] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm text-[#9BA5A1] mb-2">Role</label>
              <select className="w-full bg-[#1F2D2A] text-[#E8EBE9] px-4 py-2 rounded-lg border border-[rgba(40,65,57,0.5)] focus:border-[#BB6830] focus:outline-none">
                <option>Select role</option>
                <option>Admin</option>
                <option>Moderator</option>
                <option>Viewer</option>
              </select>
            </div>

            <button className="w-full flex items-center justify-center gap-2 bg-[#BB6830] text-white px-6 py-3 rounded-lg hover:bg-[#A55A29] transition-colors">
              <UserPlus className="w-4 h-4" />
              <span>Add Administrator</span>
            </button>
          </div>
        </div>
      </div>

      <div className="bg-[#284139] rounded-lg p-6 border border-[rgba(40,65,57,0.5)]">
        <div className="flex items-center gap-2 mb-4">
          <Users className="w-5 h-5 text-[#BB6830]" />
          <h3 className="text-lg text-[#E8EBE9]">Current Administrators</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[rgba(40,65,57,0.5)]">
                <th className="text-left text-[#9BA5A1] text-sm font-medium py-3 px-4">Name</th>
                <th className="text-left text-[#9BA5A1] text-sm font-medium py-3 px-4">Email</th>
                <th className="text-left text-[#9BA5A1] text-sm font-medium py-3 px-4">Role</th>
                <th className="text-left text-[#9BA5A1] text-sm font-medium py-3 px-4">Status</th>
                <th className="text-left text-[#9BA5A1] text-sm font-medium py-3 px-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {adminUsers.map((user, index) => (
                <tr
                  key={index}
                  className="border-b border-[rgba(40,65,57,0.3)] last:border-0"
                >
                  <td className="text-[#E8EBE9] text-sm py-4 px-4">{user.name}</td>
                  <td className="text-[#9BA5A1] text-sm py-4 px-4">{user.email}</td>
                  <td className="text-[#E8EBE9] text-sm py-4 px-4">{user.role}</td>
                  <td className="py-4 px-4">
                    <span
                      className={`px-3 py-1 rounded-full text-xs ${
                        user.status === 'Active'
                          ? 'bg-[#4A9D7F] text-white'
                          : 'bg-[#9BA5A1] text-[#1F2D2A]'
                      }`}
                    >
                      {user.status}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <button className="text-[#BB6830] hover:text-[#A55A29] text-sm">
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
