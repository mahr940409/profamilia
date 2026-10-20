import { useState, type FormEvent } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Plus, KeyRound, UserCheck, UserX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  createReporter,
  reporterAdminData,
  resetReporterPassword,
  toggleReporter,
} from "@/lib/reporter-access.functions";
import { toast } from "sonner";

export function ReporterManager() {
  const queryClient = useQueryClient(),
    create = useServerFn(createReporter),
    reset = useServerFn(resetReporterPassword),
    toggle = useServerFn(toggleReporter);
  const { data = [] } = useQuery({
    queryKey: ["reporter-profiles"],
    queryFn: () => reporterAdminData(),
  });
  const [username, setUsername] = useState(""),
    [fullName, setFullName] = useState(""),
    [busy, setBusy] = useState(false);
  async function add(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    try {
      await create({ data: { username, full_name: fullName } });
      setUsername("");
      setFullName("");
      await queryClient.invalidateQueries({ queryKey: ["reporter-profiles"] });
      toast.success("Usuario creado correctamente.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo crear.");
    } finally {
      setBusy(false);
    }
  }
  async function run(action: () => Promise<unknown>, message: string) {
    if (!window.confirm(message)) return;
    try {
      await action();
      await queryClient.invalidateQueries({ queryKey: ["reporter-profiles"] });
      toast.success("Cambio guardado.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo guardar.");
    }
  }
  return (
    <section>
      <h2 className="text-lg font-semibold">Usuarios reportadores</h2>
      <form className="catalog-add" onSubmit={add}>
        <Input
          placeholder="Nombre completo"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          required
        />
        <Input
          placeholder="usuario.apellido"
          value={username}
          onChange={(e) => setUsername(e.target.value.toLowerCase())}
          pattern="[a-z0-9]+(\.[a-z0-9]+)+"
          required
        />
        <Button disabled={busy}>
          <Plus />
          Agregar
        </Button>
      </form>
      {data.map((item: any) => (
        <div className="catalog-row" key={item.user_id}>
          <span>
            {item.full_name}
            <small className={`catalog-state block ${item.active ? "is-active" : "is-inactive"}`}>
              {item.username} · {item.active ? "Activo" : "Inactivo"}
            </small>
          </span>
          <Button
            variant="ghost"
            size="icon"
            title="Restablecer contraseña"
            aria-label={`Restablecer contraseña de ${item.full_name}`}
            onClick={() =>
              run(
                () => reset({ data: { user_id: item.user_id } }),
        "¿Restablecer la contraseña de este usuario?",
              )
            }
          >
            <KeyRound />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            title={item.active ? "Desactivar" : "Activar"}
            aria-label={`${item.active ? "Desactivar" : "Activar"} ${item.full_name}`}
            onClick={() =>
              run(
                () => toggle({ data: { user_id: item.user_id, active: !item.active } }),
                `¿${item.active ? "Desactivar" : "Activar"} este usuario?`,
              )
            }
          >
            {item.active ? <UserX /> : <UserCheck />}
          </Button>
        </div>
      ))}
    </section>
  );
}
