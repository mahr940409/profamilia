import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import {
  BarChart3,
  ClipboardList,
  UsersRound,
  ArrowRightLeft,
  LogOut,
  FileSpreadsheet,
  FileText,
  Plus,
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CatalogSelect } from "./catalog-select";
import { AppHeader } from "./app-header";
import { saveCatalog, deleteCatalog, deleteIncident, adminData } from "@/lib/incidents.functions";
import {
  displayDate,
  displayTime,
  filterIncidents,
  summarize,
  variation,
  evolution,
  todayBogota,
  catalogSchema,
  type Catalog,
  type Filters,
} from "@/lib/incident-data";
import { lockAdmin } from "@/lib/admin-access.functions";
import { exportReport } from "@/lib/export-report";
import { toast } from "sonner";
import { ReporterManager } from "./reporter-manager";

type Data = Awaited<ReturnType<typeof adminData>>;
function monthPeriod(date: string, offset: number) {
  const [year, month] = date.slice(0, 7).split("-").map(Number);
  const start = new Date(Date.UTC(year, month - 1 + offset, 1));
  const end = new Date(Date.UTC(year, month + offset, 0));
  const format = (value: Date) => value.toISOString().slice(0, 10);
  return { start: format(start), end: format(end) };
}
export function AdminPanel({ data }: { data: Data }) {
  const today = todayBogota();
  const currentMonth = monthPeriod(today, 0), previousMonth = monthPeriod(today, -1);
  const [tab, setTab] = useState("records"),
    [f, setF] = useState<Filters>({
      employee: "",
      type: "",
      start: today.slice(0, 7) + "-01",
      end: today,
    }),
    [second, setSecond] = useState({ start: today.slice(0, 7) + "-01", end: today }),
    [group, setGroup] = useState<"day" | "week" | "month">("day"),
    [page, setPage] = useState(0),
    [exporting, setExporting] = useState(false);
  const lock = useServerFn(lockAdmin);
  const queryClient = useQueryClient(),
    navigate = useNavigate();
  const rows = filterIncidents(data.rows, f),
    comparison = filterIncidents(data.rows, { ...f, ...second }),
    summary = summarize(rows, f.start, f.end),
    currentMonthSummary = summarize(filterIncidents(data.rows, { employee: f.employee, type: f.type, ...currentMonth }), currentMonth.start, currentMonth.end),
    previousMonthSummary = summarize(filterIncidents(data.rows, { employee: f.employee, type: f.type, ...previousMonth }), previousMonth.start, previousMonth.end),
    monthlyDelta = variation(previousMonthSummary.daily, currentMonthSummary.daily),
    other = summarize(comparison, second.start, second.end),
    delta = variation(summary.total, other.total),
    series = evolution(rows, f.start, f.end, group);
  const update = (key: keyof Filters, value: string) => {
    setF({ ...f, [key]: value });
    setPage(0);
  };
  const valid =
    f.start <= f.end &&
    second.start <= second.end &&
    Boolean(f.start && f.end && second.start && second.end);
  async function logout() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await lock();
    await navigate({ to: "/auth", replace: true });
  }
  async function download(format: "excel" | "pdf") {
    if (!valid) return;
    setExporting(true);
    try {
      const fresh = await adminData();
      await exportReport(format, {
        rows: filterIncidents(fresh.rows, f),
        comparison: filterIncidents(fresh.rows, { ...f, ...second }),
        filters: f,
        second,
        comparing: tab === "compare",
        employees: fresh.employees,
        types: fresh.types,
        series: evolution(filterIncidents(fresh.rows, f), f.start, f.end, group),
      });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo exportar.");
    } finally {
      setExporting(false);
    }
  }
  return (
    <>
      <AppHeader />
      <main className="admin-main">
        <div className="admin-title">
          <div>
            <div className="eyebrow">Incidentes Profamilia</div>
            <h1>Panel de administración</h1>
          </div>
          <Button variant="outline" onClick={logout}>
            <LogOut />
            Cerrar sesión
          </Button>
        </div>
        <nav className="admin-tabs">
          {[
            { id: "records", label: "Registros", Icon: ClipboardList },
            { id: "stats", label: "Estadísticas", Icon: BarChart3 },
            { id: "compare", label: "Comparar períodos", Icon: ArrowRightLeft },
            { id: "catalogs", label: "Catálogos", Icon: UsersRound },
            { id: "reporters", label: "Usuarios", Icon: UsersRound },
          ].map(({ id, label, Icon }) => (
            <Button
              key={id}
              variant={tab === id ? "secondary" : "ghost"}
              onClick={() => setTab(id)}
            >
              <Icon />
              {label}
            </Button>
          ))}
        </nav>
        {tab === "reporters" ? <ReporterManager /> : tab === "catalogs" ? (
          <div className="chart-grid">
            <CatalogEditor kind="employees" items={data.employees} title="Empleados" />
            <CatalogEditor kind="incident_types" items={data.types} title="Tipos de incidentes" />
          </div>
        ) : (
          <>
            <div className="filters">
              <div>
                <label htmlFor="filter-employee">Empleado</label>
                <CatalogSelect
                  id="filter-employee"
                  value={f.employee}
                  onChange={(v) => update("employee", v)}
                  items={data.employees}
                  all
                  placeholder="Todos los empleados"
                />
              </div>
              <div>
                <label htmlFor="filter-type">Incidente</label>
                <CatalogSelect
                  id="filter-type"
                  value={f.type}
                  onChange={(v) => update("type", v)}
                  items={data.types}
                  all
                  placeholder="Todos los incidentes"
                />
              </div>
              <div>
                <label htmlFor="start">Desde</label>
                <Input
                  id="start"
                  type="date"
                  value={f.start}
                  onChange={(e) => update("start", e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="end">Hasta</label>
                <Input
                  id="end"
                  type="date"
                  value={f.end}
                  min={f.start}
                  onChange={(e) => update("end", e.target.value)}
                />
              </div>
            </div>
            {!valid && (
              <p role="alert" className="message-error">
                Selecciona períodos válidos: la fecha final no puede ser anterior a la inicial.
              </p>
            )}
            <>
              <div className="section-heading">
                <p className="text-xs text-muted-foreground">
                  {f.start} — {f.end} · Hora de Colombia
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    title="Actualizar registros"
                    aria-label="Actualizar registros"
                    onClick={() => queryClient.invalidateQueries({ queryKey: ["admin-data"] })}
                  >
                    <RefreshCw />
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => download("excel")}
                    disabled={exporting || !valid}
                  >
                    <FileSpreadsheet />
                    Excel
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => download("pdf")}
                    disabled={exporting || !valid}
                  >
                    <FileText />
                    PDF
                  </Button>
                </div>
              </div>
              <div className="metrics">
                <Metric label="Total de incidentes" value={summary.total} />
                <Metric label="Promedio diario · Mes actual" value={currentMonthSummary.daily.toFixed(2)} />
                <Metric label="Promedio diario · Mes anterior" value={previousMonthSummary.daily.toFixed(2)} />
                <Metric
                  label="Variación del promedio"
                  value={monthlyDelta === null ? "No calculable" : `${monthlyDelta >= 0 ? "+" : ""}${monthlyDelta.toFixed(1)}%`}
                />
                <Metric label="Empleados con registros" value={summary.employees.length} />
                <Metric label="Tipos con registros" value={summary.types.length} />
              </div>
              {tab === "records" && (
                <>
                  <div className="section-heading">
                    <h2>Registros de incidentes</h2>
                    <span className="text-xs text-muted-foreground">{rows.length} registros</span>
                  </div>
                  <div className="table-scroll">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Fecha</th>
                          <th>Hora</th>
                          <th>Empleado</th>
                          <th>Tipo de incidente</th>
                          <th>Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rows.slice(page * 15, page * 15 + 15).map((r) => (
                          <tr key={r.id}>
                            <td>{displayDate(r.created_at)}</td>
                            <td>{displayTime(r.created_at)}</td>
                            <td>{r.employees?.name}</td>
                            <td>{r.incident_types?.name}</td>
                            <td>
                              <Button
                                variant="ghost"
                                size="icon"
                                title="Eliminar incidente"
                                aria-label="Eliminar incidente"
                                onClick={async () => {
                                  if (!window.confirm("¿Eliminar este incidente?")) return;
                                  try {
                                    await deleteIncident({ data: { id: r.id } });
                                    await queryClient.invalidateQueries({ queryKey: ["admin-data"] });
                                    toast.success("Incidente eliminado.");
                                  } catch (e) {
                                    toast.error(e instanceof Error ? e.message : "No se pudo eliminar.");
                                  }
                                }}
                              >
                                <Trash2 />
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {!rows.length && <Empty />}
                  </div>
                  <div className="pagination-bar">
                    <span>
                      Página {page + 1} de {Math.max(1, Math.ceil(rows.length / 15))}
                    </span>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        aria-label="Página anterior"
                        disabled={page === 0}
                        onClick={() => setPage(page - 1)}
                      >
                        <ChevronLeft />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        aria-label="Página siguiente"
                        disabled={(page + 1) * 15 >= rows.length}
                        onClick={() => setPage(page + 1)}
                      >
                        <ChevronRight />
                      </Button>
                    </div>
                  </div>
                </>
              )}
              {tab === "stats" && (
                <>
                  <div className="section-heading">
                    <h2>Evolución de incidentes</h2>
                    <div className="flex gap-1">
                      {(["day", "week", "month"] as const).map((v, i) => (
                        <Button
                          key={v}
                          variant={group === v ? "secondary" : "ghost"}
                          size="sm"
                          onClick={() => setGroup(v)}
                        >
                          {["Diaria", "Semanal", "Mensual"][i]}
                        </Button>
                      ))}
                    </div>
                  </div>
                  {rows.length ? <Chart values={series} /> : <Empty />}
                  <div className="chart-grid">
                    <section className="chart-section">
                      <h3>Comparativa entre empleados</h3>
                      {rows.length ? <Chart values={summary.employees} /> : <Empty />}
                      <SummaryTable rows={summary.employees} />
                    </section>
                    <section className="chart-section">
                      <h3>Incidentes por tipo</h3>
                      <SummaryTable rows={summary.types} percent />
                    </section>
                  </div>
                </>
              )}
              {tab === "compare" && (
                <>
                  <h2 className="text-lg font-semibold">Segundo período</h2>
                  <div className="compare-filters">
                    <div>
                      <label htmlFor="second-start">Desde</label>
                      <Input
                        id="second-start"
                        type="date"
                        value={second.start}
                        onChange={(e) => setSecond({ ...second, start: e.target.value })}
                      />
                    </div>
                    <div>
                      <label htmlFor="second-end">Hasta</label>
                      <Input
                        id="second-end"
                        type="date"
                        min={second.start}
                        value={second.end}
                        onChange={(e) => setSecond({ ...second, end: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="metrics">
                    <Metric label={`Inicial: ${f.start} — ${f.end}`} value={summary.total} />
                    <Metric
                      label={`Segundo: ${second.start} — ${second.end}`}
                      value={other.total}
                    />
                    <Metric label="Diferencia en cantidad" value={other.total - summary.total} />
                    <Metric
                      label="Variación porcentual"
                      value={delta === null ? "No calculable" : delta.toFixed(1) + "%"}
                    />
                  </div>
                  {delta === null && (
                    <p className="text-sm text-muted-foreground mb-6">
                      No calculable: período inicial sin incidentes
                    </p>
                  )}
                  <div className="metrics">
                    <Metric label="Promedio diario · Inicial" value={summary.daily.toFixed(2)} />
                    <Metric label="Promedio diario · Segundo" value={other.daily.toFixed(2)} />
                  </div>
                  <div className="chart-grid">
                    <section>
                      <h3 className="mb-4 font-semibold">
                        Inicial · {f.start} — {f.end}
                      </h3>
                      <SummaryTable rows={summary.employees} />
                      <div className="mt-6">
                        <SummaryTable rows={summary.types} percent />
                      </div>
                    </section>
                    <section>
                      <h3 className="mb-4 font-semibold">
                        Segundo · {second.start} — {second.end}
                      </h3>
                      <SummaryTable rows={other.employees} />
                      <div className="mt-6">
                        <SummaryTable rows={other.types} percent />
                      </div>
                    </section>
                  </div>
                </>
              )}
            </>
          </>
        )}
      </main>
    </>
  );
}
function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="metric">
      <p>{label}</p>
      <strong>{value}</strong>
    </div>
  );
}
function Empty() {
  return <div className="empty-state">Sin datos para el período seleccionado</div>;
}
function Chart({ values }: { values: { name: string; count: number }[] }) {
  return (
    <div className="chart-box">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={values} margin={{ left: 0, right: 10, bottom: 8 }}>
          <CartesianGrid stroke="var(--border)" vertical={false} />
          <XAxis
            dataKey="name"
            tick={{ fill: "var(--muted-foreground)", fontSize: 10 }}
            tickFormatter={(v) => (v.length > 18 ? v.slice(0, 17) + "…" : v)}
          />
          <YAxis allowDecimals={false} tick={{ fill: "var(--muted-foreground)", fontSize: 10 }} />
          <Tooltip
            contentStyle={{
              background: "var(--card)",
              borderColor: "var(--border)",
              borderRadius: 6,
            }}
          />
          <Bar
            dataKey="count"
            name="Incidentes"
            fill="var(--chart-1)"
            maxBarSize={45}
            radius={[3, 3, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
function SummaryTable({
  rows,
  percent = false,
}: {
  rows: { name: string; count: number; percent?: number }[];
  percent?: boolean;
}) {
  return (
    <div className="table-scroll">
      <table className="data-table">
        <thead>
          <tr>
            <th>{percent ? "Tipo de incidente" : "Empleado"}</th>
            <th>Cantidad</th>
            {percent && <th>%</th>}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.name}>
              <td>{r.name}</td>
              <td>{r.count}</td>
              {percent && <td>{r.percent?.toFixed(1)}%</td>}
            </tr>
          ))}
        </tbody>
      </table>
      {!rows.length && <Empty />}
    </div>
  );
}
function CatalogEditor({
  kind,
  items,
  title,
}: {
  kind: "employees" | "incident_types";
  items: Catalog[];
  title: string;
}) {
  const save = useServerFn(saveCatalog),
    remove = useServerFn(deleteCatalog),
    queryClient = useQueryClient();
  const [name, setName] = useState(""),
    [edit, setEdit] = useState<Catalog | null>(null),
    [editName, setEditName] = useState(""),
    [busy, setBusy] = useState(false);
  async function persist(item: { id?: string; name: string; active: boolean }) {
    const parsed = catalogSchema.safeParse({ kind, ...item });
    if (!parsed.success) {
      toast.error("Escribe un nombre de entre 1 y 100 caracteres.");
      return;
    }
    setBusy(true);
    try {
      await save({ data: parsed.data });
      setName("");
      setEdit(null);
      await queryClient.invalidateQueries({ queryKey: ["admin-data"] });
      await queryClient.invalidateQueries({ queryKey: ["public-catalogs"] });
      toast.success("Cambios guardados.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo guardar.");
    } finally {
      setBusy(false);
    }
  }
  async function removeItem(item: Catalog) {
    if (!window.confirm(`¿Eliminar ${item.name}?`)) return;
    setBusy(true);
    try {
      await remove({ data: { kind, id: item.id } });
      await queryClient.invalidateQueries({ queryKey: ["admin-data"] });
      await queryClient.invalidateQueries({ queryKey: ["public-catalogs"] });
      toast.success("Elemento eliminado.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo eliminar. Si tiene registros asociados, desactívalo.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <section>
      <h2 className="text-lg font-semibold">{title}</h2>
      <form
        className="catalog-add"
        onSubmit={(e) => {
          e.preventDefault();
          persist({ name, active: true });
        }}
      >
        <Input
          aria-label={`Nuevo: ${title}`}
          placeholder="Nombre"
          value={name}
          maxLength={100}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <Button disabled={busy} type="submit">
          <Plus />
          Agregar
        </Button>
      </form>
      {items.map((item) => {
        const active = item.active ?? false;
        return (
          <div className="catalog-row" key={item.id}>
            <span>
              {item.name}
              <small className={`catalog-state block ${active ? "is-active" : "is-inactive"}`}>
                {active ? "Activo" : "Inactivo"}
              </small>
            </span>
            <Button
              variant="ghost"
              size="icon"
              disabled={busy}
              title="Editar nombre"
              aria-label={`Editar ${item.name}`}
              onClick={() => {
                setEdit(item);
                setEditName(item.name);
              }}
            >
              <Pencil />
            </Button>
            <button
              type="button"
              className={`status-toggle ${active ? "is-active" : "is-inactive"}`}
              disabled={busy}
              aria-pressed={active}
              aria-label={`${active ? "Desactivar" : "Activar"} ${item.name}`}
              onClick={() => persist({ ...item, active: !active })}
            >
              <span className="status-dot" aria-hidden="true" />
              {active ? "Activo" : "Inactivo"}
            </button>
            <Button
              variant="ghost"
              size="icon"
              disabled={busy}
              title="Eliminar"
              aria-label={`Eliminar ${item.name}`}
              onClick={() => removeItem(item)}
            >
              <Trash2 />
            </Button>
          </div>
        );
      })}
      <Dialog
        open={Boolean(edit)}
        onOpenChange={(open) => {
          if (!open) setEdit(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar nombre</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (edit) persist({ id: edit.id, name: editName, active: edit.active ?? true });
            }}
          >
            <Input
              aria-label="Nombre"
              value={editName}
              maxLength={100}
              onChange={(e) => setEditName(e.target.value)}
              required
            />
            <Button className="mt-4" disabled={busy}>
              Guardar cambios
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </section>
  );
}
