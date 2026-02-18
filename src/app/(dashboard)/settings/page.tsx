"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { updateProfile, updatePassword } from "firebase/auth";
import { Loader2, User, Lock, LogOut, Sun, Moon, Monitor, Utensils } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { PantryManagement } from "@/components/settings/PantryManagement";
import { useDietaryProfile } from "@/hooks/useDietaryProfile";
import { DIET_TYPES, ALLERGY_OPTIONS } from "@/types";

export default function SettingsPage() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();
  const { profile, loading: profileLoading, saving: profileSaving, saveProfile } = useDietaryProfile();

  const [name, setName] = useState(user?.displayName || "");
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  // Dietary profile local state
  const [dietType, setDietType] = useState<string>("");
  const [allergies, setAllergies] = useState<string[]>([]);
  const [avoidIngredients, setAvoidIngredients] = useState("");

  // Sync dietary profile from Firestore when loaded
  const [dietSynced, setDietSynced] = useState(false);
  if (!profileLoading && !dietSynced) {
    setDietSynced(true);
    setDietType(profile.dietType || "");
    setAllergies(profile.allergies);
    setAvoidIngredients(profile.avoidIngredients.join(", "));
  }

  const handleSaveDietaryProfile = async () => {
    await saveProfile({
      dietType: dietType || null,
      allergies,
      avoidIngredients: avoidIngredients
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
    });
    toast({ title: "Preferencias guardadas", description: "Tu perfil dietetico se actualizo correctamente" });
  };

  const toggleAllergy = (value: string) => {
    setAllergies((prev) =>
      prev.includes(value) ? prev.filter((a) => a !== value) : [...prev, value]
    );
  };

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

      {/* Appearance */}
      <Card className="border-border/60">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Sun className="h-4 w-4 text-primary" />
            </div>
            Apariencia
          </CardTitle>
          <CardDescription>Elige el tema visual de la aplicacion</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            {[
              { value: "light", label: "Claro", icon: Sun },
              { value: "dark", label: "Oscuro", icon: Moon },
              { value: "system", label: "Sistema", icon: Monitor },
            ].map(({ value, label, icon: Icon }) => (
              <Button
                key={value}
                variant={theme === value ? "default" : "outline"}
                className="gap-2"
                onClick={() => setTheme(value)}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Dietary profile */}
      <Card className="border-border/60">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Utensils className="h-4 w-4 text-primary" />
            </div>
            Perfil dietetico
          </CardTitle>
          <CardDescription>
            Tus preferencias alimentarias se usan al generar recetas y planes de comida
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {profileLoading ? (
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <Loader2 className="h-4 w-4 animate-spin" />
              Cargando preferencias...
            </div>
          ) : (
            <>
              {/* Diet type */}
              <div className="space-y-2">
                <Label>Tipo de dieta</Label>
                <Select value={dietType} onValueChange={setDietType}>
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder="Selecciona tu dieta" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ninguno">Sin preferencia</SelectItem>
                    {DIET_TYPES.map((d) => (
                      <SelectItem key={d.value} value={d.value}>
                        {d.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Allergies */}
              <div className="space-y-2">
                <Label>Alergias e intolerancias</Label>
                <div className="flex flex-wrap gap-x-6 gap-y-3 pt-1">
                  {ALLERGY_OPTIONS.map((a) => (
                    <div key={a.value} className="flex items-center gap-2">
                      <Checkbox
                        id={`allergy-${a.value}`}
                        checked={allergies.includes(a.value)}
                        onCheckedChange={() => toggleAllergy(a.value)}
                      />
                      <Label htmlFor={`allergy-${a.value}`} className="cursor-pointer font-normal">
                        {a.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Avoid ingredients */}
              <div className="space-y-2">
                <Label htmlFor="avoidIngredients">Ingredientes a evitar</Label>
                <Textarea
                  id="avoidIngredients"
                  placeholder="Ej: cilantro, picante, aceitunas (separados por coma)"
                  value={avoidIngredients}
                  onChange={(e) => setAvoidIngredients(e.target.value)}
                  className="resize-none"
                  rows={3}
                />
                <p className="text-xs text-muted-foreground">
                  Ingresa ingredientes separados por coma
                </p>
              </div>

              <Button onClick={handleSaveDietaryProfile} disabled={profileSaving}>
                {profileSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  "Guardar preferencias"
                )}
              </Button>
            </>
          )}
        </CardContent>
      </Card>

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
