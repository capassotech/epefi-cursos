import { useAuth } from "@/contexts/AuthContext";
import { ArrowLeft, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export default function Profile() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="font-sans container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-6 sm:space-y-8 min-h-screen text-[#4B4B4C]">
      <div className="flex items-center gap-4 border-b border-gray-200 dark:border-gray-700 pb-4 mb-8">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/")}
          className="self-start sm:mt-1"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="">
          <h1 className="text-3xl font-bold tracking-wide text-black dark:text-white">
            Perfil
          </h1>
          <p className="text-base text-[#4B4B4C] dark:text-zinc-300 mt-1">
            Información personal y edición de tu cuenta.
          </p>
        </div>
      </div>

      <section className=" rounded-xl shadow-lg p-6 space-y-6">
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 rounded-full bg-[#8B3740] flex items-center justify-center text-white text-xl font-bold">
            {user.nombre.charAt(0)}
            {user.apellido.charAt(0)}
          </div>
          <div>
            <h2 className="text-xl font-semibold text-[#8B3740] dark:text-white">
              {user.nombre} {user.apellido}
            </h2>
            <p className="text-sm text-[#4B4B4C] dark:text-zinc-300">
              {user.email}
            </p>
            <p className="text-sm text-[#4B4B4C] dark:text-zinc-300">
              DNI: {user.dni}
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#4B4B4C] dark:text-zinc-200">
              Nombre completo
            </label>
            <input
              type="text"
              disabled
              defaultValue={`${user.nombre} ${user.apellido}`}
              className="mt-1 w-full border border-[#D8D3CA] dark:text-zinc-300 dark:border-zinc-700 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-[#D8A848]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#4B4B4C] dark:text-zinc-200">
              Correo electrónico
            </label>
            <input
              type="email"
              disabled
              defaultValue={user.email}
              className="mt-1 w-full border border-[#D8D3CA] dark:text-zinc-300 dark:border-zinc-700 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-[#D8A848]"
            />
          </div>
        </div>

        <div className="flex justify-end gap-4">
          <Button
            variant="outline"
            className="px-6 py-3 bg-[#8B3740] dark:bg-zinc-700 text-white rounded-lg hover:bg-[#D8A848] transition-colors font-medium"
          >
            Guardar cambios
          </Button>
        </div>
      </section>
    </div>
  );
}
