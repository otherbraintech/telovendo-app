"use client";

import { useState } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { 
  Users, 
  UserPlus, 
  Search, 
  MoreVertical, 
  Edit, 
  Trash2, 
  Shield, 
  RefreshCw, 
  CheckCircle2, 
  XCircle,
  KeyRound,
  Eye,
  EyeOff,
  User as UserIcon,
  ShieldCheck,
  ShieldAlert
} from "lucide-react";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { createUser, updateUser, deleteUser } from "@/lib/actions/users";

export default function UsersClient({ initialUsers, currentUser }: { initialUsers: any[], currentUser: any }) {
  const [users, setUsers] = useState(initialUsers);
  const [search, setSearch] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Form states
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    name: "",
    password: "",
    role: "USUARIO" as "ADMIN" | "USUARIO" | "ESPECTADOR"
  });

  const filteredUsers = users.filter((u: any) => 
    u.username.toLowerCase().includes(search.toLowerCase()) || 
    u.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const newUser = await createUser({
        username: formData.username,
        email: formData.email,
        name: formData.name,
        password: formData.password,
        role: formData.role
      });
      setUsers([newUser, ...users]);
      setIsCreateModalOpen(false);
      resetForm();
      toast.success("✅ Usuario creado exitosamente");
    } catch (err: any) {
      toast.error("❌ Error al crear usuario", { description: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const updatedUser = await updateUser(selectedUser.id, {
        username: formData.username,
        email: formData.email,
        name: formData.name,
        password: formData.password || undefined,
        role: formData.role
      });
      setUsers(users.map((u: any) => u.id === selectedUser.id ? updatedUser : u));
      setIsEditModalOpen(false);
      setSelectedUser(null);
      resetForm();
      toast.success("✅ Usuario actualizado");
    } catch (err: any) {
      toast.error("❌ Error al actualizar", { description: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (id === currentUser.id) {
        toast.error("❌ No puedes eliminar tu propio usuario");
        return;
    }

    if (!confirm("¿Estás seguro de eliminar este usuario?")) return;

    try {
      await deleteUser(id);
      setUsers(users.filter((u: any) => u.id !== id));
      toast.success("🗑️ Usuario eliminado");
    } catch (err: any) {
      toast.error("❌ Error al eliminar", { description: err.message });
    }
  };

  const resetForm = () => {
    setFormData({ username: "", email: "", name: "", password: "", role: "USUARIO" });
  };

  const openEditModal = (user: any) => {
    setSelectedUser(user);
    setFormData({
      username: user.username,
      email: user.email || "",
      name: user.name,
      password: "",
      role: user.role
    });
    setIsEditModalOpen(true);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl md:text-4xl font-black uppercase italic tracking-tighter text-foreground flex items-center gap-3">
            Gestión <span className="text-blue-500">Usuarios</span>
          </h1>
          <p className="text-xs text-muted-foreground uppercase font-bold tracking-widest">Administra los accesos y roles del sistema.</p>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3 text-muted-foreground group-focus-within:text-blue-500 transition-colors" />
            <input 
              type="text" 
              placeholder="Buscar por nombre o usuario..." 
              value={search} 
              onChange={(e) => setSearch(e.target.value)}
              className="w-48 sm:w-80 bg-card border border-border px-4 py-2.5 pl-9 text-[10px] uppercase font-bold tracking-widest focus:ring-1 focus:ring-blue-500 outline-none text-foreground transition-all" 
            />
          </div>
          <Button 
            onClick={() => { resetForm(); setIsCreateModalOpen(true); }}
            className="rounded-none bg-blue-600 hover:bg-blue-700 text-white font-black text-[10px] uppercase tracking-[0.2em] px-6 h-10 shadow-[0_0_20px_rgba(37,99,235,0.2)]"
          >
            <UserPlus className="mr-2 size-3.5" /> Nuevo Usuario
          </Button>
        </div>
      </div>

      {/* USERS TABLE */}
      <div className="bg-card border border-border shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-1 h-full bg-blue-600"></div>
        <Table>
          <TableHeader className="bg-muted/30">
            <TableRow className="border-border hover:bg-transparent">
              <TableHead className="text-[10px] uppercase font-black tracking-widest px-8">Nombre completo</TableHead>
              <TableHead className="text-[10px] uppercase font-black tracking-widest">Usuario / Email</TableHead>
              <TableHead className="text-[10px] uppercase font-black tracking-widest">Rol</TableHead>
              <TableHead className="text-[10px] uppercase font-black tracking-widest">Fecha Creación</TableHead>
              <TableHead className="text-[10px] uppercase font-black tracking-widest text-right px-8">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.length === 0 ? (
                <TableRow>
                    <TableCell colSpan={5} className="h-40 text-center text-xs uppercase font-bold text-muted-foreground">No se encontraron usuarios</TableCell>
                </TableRow>
            ) : filteredUsers.map((user: any) => (
              <TableRow key={user.id} className="border-border/50 hover:bg-muted/20 transition-all group">
                <TableCell className="px-8 py-6">
                  <div className="flex items-center gap-3">
                    <div className="size-9 bg-muted border border-border flex items-center justify-center font-black text-[10px] text-muted-foreground">
                        {user.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[11px] font-black uppercase text-foreground">{user.name}</span>
                      {user.id === currentUser.id && <Badge className="w-fit h-4 text-[7px] font-black uppercase bg-blue-500/10 text-blue-500 border-none">Tú</Badge>}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-mono font-bold text-muted-foreground">{user.username}</span>
                    {user.email && (
                      <span className="text-[9px] text-muted-foreground/60">{user.email}</span>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  {user.role === "ADMIN" ? (
                    <div className="flex items-center gap-1.5 text-blue-500">
                      <ShieldCheck className="size-3.5" />
                      <span className="text-[9px] font-black uppercase tracking-wider">ADMINISTRADOR</span>
                    </div>
                  ) : user.role === "ESPECTADOR" ? (
                    <div className="flex items-center gap-1.5 text-purple-500">
                      <Eye className="size-3.5" />
                      <span className="text-[9px] font-black uppercase tracking-wider">ESPECTADOR</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <UserIcon className="size-3.5" />
                      <span className="text-[9px] font-black uppercase tracking-wider">USUARIO ESTÁNDAR</span>
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  <span className="text-[10px] font-bold text-muted-foreground uppercase">{format(new Date(user.createdAt), "dd MMM yyyy", { locale: es })}</span>
                </TableCell>
                <TableCell className="px-8 py-6 text-right">
                  <div className="flex items-center justify-end gap-2 opacity-50 group-hover:opacity-100 transition-opacity">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => openEditModal(user)} 
                      className="size-8 rounded-none border border-border hover:bg-blue-600 hover:text-white transition-all"
                    >
                      <Edit className="size-3.5" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => handleDelete(user.id)}
                      disabled={user.id === currentUser.id}
                      className="size-8 rounded-none border border-border hover:bg-red-600 hover:text-white text-red-500 disabled:opacity-20 transition-all"
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* CREATE MODAL */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="max-w-md rounded-none bg-card border border-border p-0 overflow-hidden">
          <div className="h-1.5 w-full bg-blue-600"></div>
          <form onSubmit={handleCreate}>
            <div className="p-8 space-y-6">
              <DialogHeader className="space-y-1">
                <DialogTitle className="text-xl font-black uppercase italic tracking-tighter">Crear <span className="text-blue-500">Usuario</span></DialogTitle>
                <DialogDescription className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Ingresa los datos del nuevo miembro del equipo.</DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                <div className="grid gap-2">
                  <Label className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground">Nombre Completo</Label>
                  <Input 
                    required 
                    className="rounded-none bg-muted/30 border-border focus:ring-1 focus:ring-blue-500 h-11 text-xs font-bold uppercase" 
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                  />
                </div>
                <div className="grid gap-2">
                  <Label className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground">Nombre de Usuario</Label>
                  <Input 
                    required 
                    className="rounded-none bg-muted/30 border-border focus:ring-1 focus:ring-blue-500 h-11 text-xs font-bold" 
                    value={formData.username}
                    onChange={(e) => setFormData({...formData, username: e.target.value})}
                  />
                </div>
                <div className="grid gap-2">
                  <Label className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground">Correo (Opcional)</Label>
                  <Input 
                    type="email"
                    className="rounded-none bg-muted/30 border-border focus:ring-1 focus:ring-blue-500 h-11 text-xs font-bold" 
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                  />
                </div>
                <div className="grid gap-2">
                  <Label className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground">Contraseña de Acceso</Label>
                  <div className="relative">
                    <Input 
                      required 
                      type={showPassword ? "text" : "password"}
                      className="rounded-none bg-muted/30 border-border focus:ring-1 focus:ring-blue-500 h-11 text-xs font-bold" 
                      value={formData.password}
                      onChange={(e) => setFormData({...formData, password: e.target.value})}
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                        {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground">Rol Asignado</Label>
                  <Select value={formData.role} onValueChange={(val: any) => setFormData({...formData, role: val})}>
                    <SelectTrigger className="rounded-none bg-muted/30 border-border h-11 text-[10px] font-black uppercase">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-none bg-card border-border">
                      <SelectItem value="USUARIO" className="text-[10px] font-bold uppercase focus:bg-blue-600 focus:text-white">Usuario Estándar</SelectItem>
                      <SelectItem value="ESPECTADOR" className="text-[10px] font-bold uppercase focus:bg-blue-600 focus:text-white">Espectador</SelectItem>
                      <SelectItem value="ADMIN" className="text-[10px] font-bold uppercase focus:bg-blue-600 focus:text-white">Administrador</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <DialogFooter className="p-8 bg-muted/20 border-t border-border mt-0 gap-3">
              <Button type="button" variant="outline" onClick={() => setIsCreateModalOpen(false)} className="rounded-none font-bold uppercase text-[10px] tracking-widest px-6 h-11">Cancelar</Button>
              <Button type="submit" disabled={loading} className="rounded-none bg-blue-600 hover:bg-blue-700 text-white font-black uppercase text-[10px] tracking-widest px-8 h-11 flex-1">
                {loading ? <RefreshCw className="mr-2 size-4 animate-spin" /> : <Shield className="mr-2 size-4" />}
                Registrar Usuario
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

       {/* EDIT MODAL */}
       <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-md rounded-none bg-card border border-border p-0 overflow-hidden">
          <div className="h-1.5 w-full bg-amber-500"></div>
          <form onSubmit={handleUpdate}>
            <div className="p-8 space-y-6">
              <DialogHeader className="space-y-1">
                <DialogTitle className="text-xl font-black uppercase italic tracking-tighter">Editar <span className="text-amber-500">Usuario</span></DialogTitle>
                <DialogDescription className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Modifica los permisos o datos del usuario seleccionado.</DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                <div className="grid gap-2">
                  <Label className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground">Nombre Completo</Label>
                  <Input 
                    required 
                    className="rounded-none bg-muted/30 border-border focus:ring-1 focus:ring-amber-500 h-11 text-xs font-bold uppercase" 
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                  />
                </div>
                <div className="grid gap-2">
                  <Label className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground">Nombre de Usuario</Label>
                  <Input 
                    required 
                    className="rounded-none bg-muted/30 border-border focus:ring-1 focus:ring-amber-500 h-11 text-xs font-bold" 
                    value={formData.username}
                    onChange={(e) => setFormData({...formData, username: e.target.value})}
                  />
                </div>
                <div className="grid gap-2">
                  <Label className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground">Correo (Opcional)</Label>
                  <Input 
                    type="email"
                    className="rounded-none bg-muted/30 border-border focus:ring-1 focus:ring-amber-500 h-11 text-xs font-bold" 
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                  />
                </div>
                <div className="grid gap-2">
                  <Label className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground">Nueva Contraseña (Opcional)</Label>
                  <div className="relative">
                    <Input 
                      placeholder="Dejar en blanco para no cambiar"
                      type={showPassword ? "text" : "password"}
                      className="rounded-none bg-muted/30 border-border focus:ring-1 focus:ring-amber-500 h-11 text-xs font-bold" 
                      value={formData.password}
                      onChange={(e) => setFormData({...formData, password: e.target.value})}
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                        {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground">Rol Asignado</Label>
                  <Select value={formData.role} onValueChange={(val: any) => setFormData({...formData, role: val})}>
                    <SelectTrigger className="rounded-none bg-muted/30 border-border h-11 text-[10px] font-black uppercase">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-none bg-card border-border">
                      <SelectItem value="USUARIO" className="text-[10px] font-bold uppercase focus:bg-amber-500 focus:text-white">Usuario Estándar</SelectItem>
                      <SelectItem value="ESPECTADOR" className="text-[10px] font-bold uppercase focus:bg-amber-500 focus:text-white">Espectador</SelectItem>
                      <SelectItem value="ADMIN" className="text-[10px] font-bold uppercase focus:bg-amber-500 focus:text-white">Administrador</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <DialogFooter className="p-8 bg-muted/20 border-t border-border mt-0 gap-3">
              <Button type="button" variant="outline" onClick={() => setIsEditModalOpen(false)} className="rounded-none font-bold uppercase text-[10px] tracking-widest px-6 h-11">Cancelar</Button>
              <Button type="submit" disabled={loading} className="rounded-none bg-amber-500 hover:bg-amber-600 text-white font-black uppercase text-[10px] tracking-widest px-8 h-11 flex-1">
                {loading ? <RefreshCw className="mr-2 size-4 animate-spin" /> : <ShieldAlert className="mr-2 size-4" />}
                Guardar Cambios
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
