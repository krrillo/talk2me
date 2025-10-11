import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { toast } from "@/components/ui/toast";
import { useAuthStore } from "@/lib/stores/useAuthStore";

export default function LoginForm() {
  const [username, setUsername] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuthStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) {
      toast.error("Por favor ingresa tu nombre");
      return;
    }

    setIsLoading(true);
    try {
      await login(username.trim());
      toast.success("¡Bienvenido a HablaConmigo!");
    } catch (error) {
      toast.error("Error al iniciar sesión");
      console.error("Login error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
            <span className="text-2xl font-bold text-white">HC</span>
          </div>
          <CardTitle className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            HablaConmigo
          </CardTitle>
          <p className="text-gray-600 mt-2">Plataforma de aprendizaje inclusivo</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
                Nombre del estudiante
              </label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Escribe tu nombre aquí"
                className="w-full text-lg py-3"
                disabled={isLoading}
                autoFocus
              />
            </div>
            <Button 
              type="submit" 
              variant="game" 
              size="xl" 
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? "Cargando..." : "Comenzar a aprender"}
            </Button>
          </form>
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500">
              Diseñado especialmente para niños con hipoacusia
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
