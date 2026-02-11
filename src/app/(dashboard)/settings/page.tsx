"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { updateProfile, updatePassword } from "firebase/auth";
import { Loader2, User, Lock, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { PantryManagement } from "@/components/settings/PantryManagement";

export default function SettingsPage() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [name, setName] = useState(user?.displayName || "");
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsUpdatingProfile(true);
    try {
      await updateProfile(user, { displayName: name });
      toast({
        title: "Perfil actualizado",
        description: "Tu nombre se ha actualizado correctamente",
      });
    } catch {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo actualizar el perfil",
      });
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (newPassword !== confirmPassword) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Las contrasenas no coinciden",
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "La contrasena debe tener al menos 6 caracteres",
      });
      return;
    }

    setIsUpdatingPassword(true);
    try {
      await updatePassword(user, newPassword);
      toast({
        title: "Contrasena actualizada",
        description: "Tu contrasena se ha actualizado correctamente",
      });
      setNewPassword("");
      setConfirmPassword("");
    } catch {
      toast({
        variant: "destructive",
        title: "Error",
        description:
          "No se pudo actualizar la contrasena. Puede que necesites volver a iniciar sesion.",
      });
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  return (
    <div className="space-y-6 max-w-2xl animate-fade-up">
      <div>
        <h1 className="font-display text-3xl text-foreground">Configuracion</h1>
        <p className="text-muted-foreground mt-1">
          Administra tu cuenta y preferencias
        </p>
      </div>

      <Card className="border-border/60">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <User className="h-4 w-4 text-primary" />
            </div>
            Perfil
          </CardTitle>
          <CardDescription>
            Actualiza tu informacion personal
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">Correo electronico</Label>
              <Input
                id="email"
                type="email"
                value={user?.email || ""}
                disabled
                className="bg-muted/50"
              />
              <p className="text-xs text-muted-foreground">
                El correo electronico no se puede cambiar
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-medium">Nombre</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isUpdatingProfile}
                className="h-11"
              />
            </div>
            <Button type="submit" disabled={isUpdatingProfile}>
              {isUpdatingProfile ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                "Guardar cambios"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      <PantryManagement />

      <Card className="border-border/60">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Lock className="h-4 w-4 text-primary" />
            </div>
            Seguridad
          </CardTitle>
          <CardDescription>Cambia tu contrasena</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUpdatePassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="newPassword" className="text-sm font-medium">Nueva contrasena</Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                disabled={isUpdatingPassword}
                className="h-11"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-sm font-medium">Confirmar contrasena</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={isUpdatingPassword}
                className="h-11"
              />
            </div>
            <Button type="submit" disabled={isUpdatingPassword}>
              {isUpdatingPassword ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Actualizando...
                </>
              ) : (
                "Cambiar contrasena"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="border-destructive/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <div className="w-8 h-8 rounded-lg bg-destructive/10 flex items-center justify-center">
              <LogOut className="h-4 w-4 text-destructive" />
            </div>
            Cerrar sesion
          </CardTitle>
          <CardDescription>
            Cierra tu sesion en este dispositivo
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="destructive" onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            Cerrar sesion
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
