import { useState } from 'react';
import { toast } from 'sonner';
import { Users, Tag, Plus, Edit2, Trash2, Search, ShieldCheck, Shield, Eye, X, Check } from 'lucide-react';

type Tab = 'users' | 'tags';
type UserRole = 'SAO Admin Coordinator' | 'Facilitator' | 'SAO Viewer';
type UserStatus = 'Active' | 'Inactive';

interface AdminUser {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  avatar: string;
  lastActive: string;
}

interface OrgTag {
  id: number;
  label: string;
  category: string;
  color: string;
  usageCount: number;
}

const INITIAL_USERS: AdminUser[] = [
  { id: 1, name: 'Kamille Salvana', email: 'k.salvana@apc.edu.ph', role: 'SAO Admin Coordinator', status: 'Active', avatar: 'KS', lastActive: 'Now' },
  { id: 2, name: 'Maria Santos', email: 'm.santos@apc.edu.ph', role: 'Facilitator', status: 'Active', avatar: 'MS', lastActive: '2 hours ago' },
  { id: 3, name: 'Jose Reyes', email: 'j.reyes@apc.edu.ph', role: 'SAO Viewer', status: 'Inactive', avatar: 'JR', lastActive: '3 days ago' },
  { id: 4, name: 'Ana Cruz', email: 'a.cruz@apc.edu.ph', role: 'Facilitator', status: 'Active', avatar: 'AC', lastActive: '1 day ago' },
  { id: 5, name: 'Rico Mendoza', email: 'r.mendoza@apc.edu.ph', role: 'SAO Viewer', status: 'Active', avatar: 'RM', lastActive: '5 hours ago' },
];

const INITIAL_TAGS: OrgTag[] = [
  { id: 1, label: 'All Students', category: 'Demographic', color: '#4A90D9', usageCount: 18 },
  { id: 2, label: 'Faculty', category: 'Demographic', color: '#A78BFA', usageCount: 12 },
  { id: 3, label: 'IT Department', category: 'Department', color: '#FDB813', usageCount: 9 },
  { id: 4, label: 'Computer Science', category: 'Department', color: '#FDB813', usageCount: 7 },
  { id: 5, label: '2nd Year', category: 'Year Level', color: '#E0A96D', usageCount: 6 },
  { id: 6, label: '3rd Year', category: 'Year Level', color: '#E0A96D', usageCount: 5 },
  { id: 7, label: '4th Year', category: 'Year Level', color: '#E0A96D', usageCount: 4 },
  { id: 8, label: 'Academic Support', category: 'Event Type', color: '#22C55E', usageCount: 8 },
  { id: 9, label: 'Sports & Athletics', category: 'Event Type', color: '#22C55E', usageCount: 5 },
  { id: 10, label: 'Cultural Events', category: 'Event Type', color: '#22C55E', usageCount: 7 },
  { id: 11, label: 'Industry Partners', category: 'Demographic', color: '#4A90D9', usageCount: 3 },
  { id: 12, label: 'All Programs', category: 'Demographic', color: '#4A90D9', usageCount: 10 },
];

const roleConfig: Record<UserRole, { icon: typeof ShieldCheck; color: string; bg: string }> = {
  'SAO Admin Coordinator': { icon: ShieldCheck, color: '#FDB813', bg: 'bg-[#FDB813]/10 border-[#FDB813]/20' },
  'Facilitator': { icon: Shield, color: '#4A90D9', bg: 'bg-[#4A90D9]/10 border-[#4A90D9]/20' },
  'SAO Viewer': { icon: Eye, color: '#8D99AE', bg: 'bg-[#8D99AE]/10 border-[#8D99AE]/20' },
};

export function SystemSettings() {
  const [tab, setTab] = useState<Tab>('users');
  const [users, setUsers] = useState(INITIAL_USERS);
  const [tags, setTags] = useState(INITIAL_TAGS);
  const [userSearch, setUserSearch] = useState('');
  const [newTag, setNewTag] = useState('');
  const [newTagCategory, setNewTagCategory] = useState('Demographic');
  const [editingUserId, setEditingUserId] = useState<number | null>(null);

  const filteredUsers = users.filter(
    u =>
      u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.email.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.role.toLowerCase().includes(userSearch.toLowerCase())
  );

  const toggleStatus = (id: number) => {
    setUsers(prev => prev.map(u =>
      u.id === id ? { ...u, status: u.status === 'Active' ? 'Inactive' : 'Active' } : u
    ));
    toast.success('User status updated.');
  };

  const removeTag = (id: number) => {
    setTags(prev => prev.filter(t => t.id !== id));
    toast.success('Tag removed.');
  };

  const addTag = () => {
    if (!newTag.trim()) return;
    const colors: Record<string, string> = {
      'Demographic': '#4A90D9',
      'Department': '#FDB813',
      'Year Level': '#E0A96D',
      'Event Type': '#22C55E',
    };
    setTags(prev => [...prev, {
      id: Date.now(),
      label: newTag.trim(),
      category: newTagCategory,
      color: colors[newTagCategory] || '#8D99AE',
      usageCount: 0,
    }]);
    setNewTag('');
    toast.success(`Tag "${newTag.trim()}" added.`);
  };

  const tagsByCategory = tags.reduce<Record<string, OrgTag[]>>((acc, tag) => {
    if (!acc[tag.category]) acc[tag.category] = [];
    acc[tag.category].push(tag);
    return acc;
  }, {});

  const tabs: { key: Tab; label: string; icon: typeof Users; count: number }[] = [
    { key: 'users', label: 'User Management', icon: Users, count: users.length },
    { key: 'tags', label: 'Tag Management', icon: Tag, count: tags.length },
  ];

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="p-6 lg:p-8 max-w-[1000px] mx-auto space-y-8">
        {/* Header */}
        <div>
          <h2 className="font-serif text-2xl lg:text-3xl font-semibold text-white">System Settings</h2>
          <p className="text-sm text-[#8D99AE] mt-1">Manage users, roles, and demographic tagging taxonomy</p>
        </div>

        {/* Tab bar */}
        <div className="flex gap-1 p-1 bg-[#162035] rounded-xl border border-white/5 w-fit">
          {tabs.map(({ key, label, icon: Icon, count }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`
                flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all
                ${tab === key
                  ? 'bg-[#1C2541] text-white shadow-sm'
                  : 'text-[#8D99AE] hover:text-white'
                }
              `}
            >
              <Icon className="w-4 h-4" />
              {label}
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full
                ${tab === key ? 'bg-[#FDB813]/15 text-[#FDB813]' : 'bg-white/5 text-[#8D99AE]'}`}>
                {count}
              </span>
            </button>
          ))}
        </div>

        {/* Users tab */}
        {tab === 'users' && (
          <div className="space-y-5">
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8D99AE]" />
                <input
                  type="text"
                  value={userSearch}
                  onChange={e => setUserSearch(e.target.value)}
                  placeholder="Search users..."
                  className="bg-[#1C2541] border border-white/5 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-[#8D99AE]/60 focus:outline-none focus:ring-1 focus:ring-[#FDB813]/40 w-64"
                />
              </div>
              <button
                onClick={() => toast.info('User invitation flow coming soon.')}
                className="flex items-center gap-2 px-4 py-2.5 bg-[#FDB813] text-[#0B132B] rounded-xl text-sm font-semibold hover:bg-[#E8A800] transition-colors flex-shrink-0"
              >
                <Plus className="w-4 h-4" /> Invite User
              </button>
            </div>

            <div className="bg-[#1C2541] rounded-2xl border border-white/5 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-[#162035] border-b border-white/5">
                      {['User', 'Role', 'Last Active', 'Status', 'Actions'].map(h => (
                        <th key={h} className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-widest text-[#8D99AE]/60">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.04]">
                    {filteredUsers.map(user => {
                      const rc = roleConfig[user.role];
                      return (
                        <tr key={user.id} className="hover:bg-white/[0.02] transition-colors">
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#FDB813]/40 to-[#E0A96D]/40 flex items-center justify-center flex-shrink-0">
                                <span className="text-[11px] font-bold text-white">{user.avatar}</span>
                              </div>
                              <div>
                                <p className="text-sm font-medium text-white">{user.name}</p>
                                <p className="text-xs text-[#8D99AE]">{user.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-4">
                            <div className={`flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full border w-fit ${rc.bg}`} style={{ color: rc.color }}>
                              <rc.icon className="w-3 h-3 flex-shrink-0" />
                              {user.role}
                            </div>
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-1.5 text-xs text-[#8D99AE]">
                              <div className={`w-1.5 h-1.5 rounded-full ${user.status === 'Active' ? 'bg-[#22C55E]' : 'bg-[#8D99AE]/30'}`} />
                              {user.lastActive}
                            </div>
                          </td>
                          <td className="px-5 py-4">
                            <button
                              onClick={() => toggleStatus(user.id)}
                              className={`flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full border transition-colors cursor-pointer
                                ${user.status === 'Active'
                                  ? 'bg-[#22C55E]/10 text-[#22C55E] border-[#22C55E]/20 hover:bg-[#22C55E]/20'
                                  : 'bg-[#8D99AE]/10 text-[#8D99AE] border-[#8D99AE]/20 hover:bg-[#8D99AE]/20'
                                }`}
                            >
                              {user.status === 'Active' ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                              {user.status}
                            </button>
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => { setEditingUserId(user.id); toast.info('Edit user flow coming soon.'); }}
                                className="w-7 h-7 flex items-center justify-center rounded-lg text-[#8D99AE] hover:text-white hover:bg-white/5 transition-colors"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              {user.id !== 1 && (
                                <button
                                  onClick={() => { setUsers(prev => prev.filter(u => u.id !== user.id)); toast.success('User removed.'); }}
                                  className="w-7 h-7 flex items-center justify-center rounded-lg text-[#8D99AE] hover:text-[#EF4444] hover:bg-[#EF4444]/5 transition-colors"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Tags tab */}
        {tab === 'tags' && (
          <div className="space-y-6">
            {/* Add tag form */}
            <div className="bg-[#1C2541] rounded-2xl border border-white/5 p-5">
              <h3 className="font-serif text-base font-semibold text-white mb-4">Add New Tag</h3>
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="text"
                  value={newTag}
                  onChange={e => setNewTag(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addTag()}
                  placeholder="Tag label (e.g. 1st Year, Business Dept.)"
                  className="flex-1 bg-[#162035] border border-white/5 rounded-xl px-4 py-2.5 text-sm text-white placeholder-[#8D99AE]/60 focus:outline-none focus:ring-1 focus:ring-[#FDB813]/40"
                />
                <select
                  value={newTagCategory}
                  onChange={e => setNewTagCategory(e.target.value)}
                  className="bg-[#162035] border border-white/5 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-[#FDB813]/40 sm:w-44"
                >
                  {['Demographic', 'Department', 'Year Level', 'Event Type'].map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
                <button
                  onClick={addTag}
                  className="flex items-center justify-center gap-2 px-5 py-2.5 bg-[#FDB813] text-[#0B132B] rounded-xl text-sm font-semibold hover:bg-[#E8A800] transition-colors flex-shrink-0"
                >
                  <Plus className="w-4 h-4" /> Add Tag
                </button>
              </div>
            </div>

            {/* Tags by category */}
            {Object.entries(tagsByCategory).map(([category, categoryTags]) => (
              <div key={category}>
                <div className="flex items-center gap-2 mb-3">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-[#8D99AE]/60">{category}</p>
                  <div className="flex-1 h-px bg-white/[0.04]" />
                  <span className="text-[10px] text-[#8D99AE]/40">{categoryTags.length} tags</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {categoryTags.map(tag => (
                    <div
                      key={tag.id}
                      className="flex items-center gap-2 pl-3 pr-2 py-1.5 rounded-full border text-sm font-medium transition-all group"
                      style={{
                        background: `${tag.color}12`,
                        borderColor: `${tag.color}25`,
                        color: tag.color,
                      }}
                    >
                      <span>{tag.label}</span>
                      <span className="text-[10px] opacity-50">×{tag.usageCount}</span>
                      <button
                        onClick={() => removeTag(tag.id)}
                        className="w-4 h-4 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-white/10 transition-all"
                      >
                        <X className="w-2.5 h-2.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {tags.length === 0 && (
              <div className="text-center py-10">
                <Tag className="w-8 h-8 text-[#8D99AE] mx-auto mb-2 opacity-40" />
                <p className="text-sm text-[#8D99AE]">No tags defined. Add your first tag above.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
