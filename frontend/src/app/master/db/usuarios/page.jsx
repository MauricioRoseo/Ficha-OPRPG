"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function UsuariosAdminPage() {
  const router = useRouter();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'player' });

  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

  useEffect(() => {
    if (!token) { router.push('/'); return; }
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:3001/users', { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error('Não autorizado');
      const data = await res.json();
      setUsers(data || []);
    } catch (e) {
      console.error(e);
      alert('Erro ao carregar usuários');
    } finally { setLoading(false); }
  };

  const handleCreate = async () => {
    if (!form.name || !form.email || !form.password) { alert('preencha nome, email e senha'); return; }
    try {
      const res = await fetch('http://localhost:3001/users', { method: 'POST', headers, body: JSON.stringify(form) });
      if (!res.ok) { const j = await res.json().catch(()=>null); throw new Error((j && j.message) || 'Erro'); }
      alert('Usuário criado');
      setForm({ name: '', email: '', password: '', role: 'player' });
      await fetchUsers();
    } catch (e) { console.error(e); alert('Erro ao criar usuário'); }
  };

  const startEdit = (u) => {
    setEditing(u.id);
    setForm({ name: u.name || '', email: u.email || '', password: '', role: u.role || 'player' });
  };

  const cancelEdit = () => { setEditing(null); setForm({ name: '', email: '', password: '', role: 'player' }); };

  const handleUpdate = async () => {
    try {
      const payload = { name: form.name, email: form.email, role: form.role };
      const res = await fetch(`http://localhost:3001/users/${editing}`, { method: 'PUT', headers, body: JSON.stringify(payload) });
      if (!res.ok) { const j = await res.json().catch(()=>null); throw new Error((j && j.message) || 'Erro'); }
      if (form.password) {
        const r2 = await fetch(`http://localhost:3001/users/${editing}/password`, { method: 'PUT', headers, body: JSON.stringify({ password: form.password }) });
        if (!r2.ok) throw new Error('Erro ao redefinir senha');
      }
      alert('Usuário atualizado');
      cancelEdit();
      await fetchUsers();
    } catch (e) { console.error(e); alert('Erro ao atualizar usuário'); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Remover usuário?')) return;
    try {
      const res = await fetch(`http://localhost:3001/users/${id}`, { method: 'DELETE', headers });
      if (!res.ok) { const j = await res.json().catch(()=>null); throw new Error((j && j.message) || 'Erro'); }
      alert('Usuário removido');
      await fetchUsers();
    } catch (e) { console.error(e); alert('Erro ao remover usuário'); }
  };

  return (
    <div className="p-6">
      <div className="surface-block mb-6">
        <div className="flex items-center justify-between py-4 px-6">
          <div>
            <h2 className="text-lg font-bold">Administração de Usuários</h2>
            <p className="text-xs text-gray-400">Criar, editar, redefinir senha ou excluir usuários</p>
          </div>
          <div>
            <button onClick={() => router.push('/master/db')} className="px-3 py-1 border rounded text-sm">Voltar ao Painel DB</button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1 surface-block p-4">
          <h3 className="font-bold mb-2">{editing ? 'Editar usuário' : 'Criar usuário'}</h3>
          <div className="space-y-2">
            <input placeholder="Nome" value={form.name} onChange={e=>setForm(f=>({...f, name: e.target.value}))} className="w-full p-2 rounded bg-[#021018] border border-white/6" />
            <input placeholder="Email" value={form.email} onChange={e=>setForm(f=>({...f, email: e.target.value}))} className="w-full p-2 rounded bg-[#021018] border border-white/6" />
            <input placeholder="Senha (somente ao criar ou redefinir)" value={form.password} onChange={e=>setForm(f=>({...f, password: e.target.value}))} className="w-full p-2 rounded bg-[#021018] border border-white/6" />
            <select value={form.role} onChange={e=>setForm(f=>({...f, role: e.target.value}))} className="w-full p-2 rounded bg-[#021018] border border-white/6">
              <option value="player">player</option>
              <option value="master">master</option>
              <option value="admin">admin</option>
            </select>
            <div className="flex gap-2">
              {editing ? (
                <>
                  <button onClick={handleUpdate} className="px-3 py-1 bg-green-600/80 rounded">Salvar</button>
                  <button onClick={cancelEdit} className="px-3 py-1 border rounded">Cancelar</button>
                </>
              ) : (
                <button onClick={handleCreate} className="px-3 py-1 bg-green-600/80 rounded">Criar</button>
              )}
            </div>
          </div>
        </div>

        <div className="md:col-span-2 surface-block p-4">
          <h3 className="font-bold mb-2">Lista de usuários</h3>
          {loading ? <div>Carregando...</div> : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-400">
                  <th className="py-2">ID</th>
                  <th>Nome</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id} className="border-t border-white/6">
                    <td className="py-2">{u.id}</td>
                    <td>{u.name}</td>
                    <td>{u.email}</td>
                    <td>{u.role}</td>
                    <td className="text-right">
                      <button onClick={()=>startEdit(u)} className="px-2 py-1 mr-2 border rounded text-xs">Editar</button>
                      <button onClick={()=>handleDelete(u.id)} className="px-2 py-1 bg-red-600/60 rounded text-xs">Remover</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
