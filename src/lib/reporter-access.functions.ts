import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

const credentials = z.object({
  username: z.string().min(3).max(120),
  password: z.string().min(1).max(256),
});
const emailFor = (username: string) => `${username.toLowerCase()}@reportantes.profamilia.local`;
const temporaryPassword = () => process.env["REPORTER_TEMP_PASSWORD"] || (() => { throw new Error("La contraseña temporal de reportadores no está configurada."); })();

export const reporterLogin = createServerFn({ method: "POST" })
  .inputValidator(credentials)
  .handler(async ({ data }) => {
    const client = createClient(
      process.env["SUPABASE_URL"]!,
      process.env["SUPABASE_PUBLISHABLE_KEY"]!,
      { auth: { persistSession: false } },
    );
    const result = await client.auth.signInWithPassword({
      email: emailFor(data.username),
      password: data.password,
    });
    if (result.error || !result.data.session || !result.data.user)
      throw new Error("Usuario o contraseña incorrectos.");
    const { reporterSession } = await import("./reporter-session.server");
    const session = await reporterSession();
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const profile = await supabaseAdmin
      .from("reporter_profiles" as never)
      .select("username,full_name,active,must_change_password,is_admin")
      .eq("user_id", result.data.user.id)
      .maybeSingle();
    const row = profile.data as { username?: string; full_name?: string; active?: boolean; must_change_password?: boolean; is_admin?: boolean } | null;
    if (!row?.active) throw new Error("Este usuario está inactivo.");
    await session.update({
      accessToken: result.data.session.access_token,
      refreshToken: result.data.session.refresh_token,
      userId: result.data.user.id,
      username: row.username,
      fullName: row.full_name,
      mustChangePassword: row.must_change_password === true,
      isAdmin: row.is_admin === true,
    });
    return { success: true, mustChangePassword: row.must_change_password === true };
  });

export const reporterLogout = createServerFn({ method: "POST" }).handler(async () => {
  const { reporterSession } = await import("./reporter-session.server");
  const session = await reporterSession();
  await session.clear();
  return { success: true };
});

export const reporterStatus = createServerFn({ method: "GET" }).handler(async () => {
  const { reporterSession } = await import("./reporter-session.server");
  const session = await reporterSession();
  return {
    authenticated: Boolean(session.data.userId),
    mustChangePassword: session.data.mustChangePassword === true,
    isAdmin: session.data.isAdmin === true,
    fullName: session.data.fullName,
  };
});

export const reporterChangePassword = createServerFn({ method: "POST" })
  .inputValidator(z.object({ password: z.string().min(8).max(256) }))
  .handler(async ({ data }) => {
    const { requireReporterSession } = await import("./reporter-session.server");
    const session = await requireReporterSession();
    const client = createClient(
      process.env["SUPABASE_URL"]!,
      process.env["SUPABASE_PUBLISHABLE_KEY"]!,
      { auth: { persistSession: false } },
    );
    const current = await client.auth.setSession({
      access_token: session.data.accessToken!,
      refresh_token: session.data.refreshToken!,
    });
    if (current.error) throw new Error("La sesión expiró. Ingresa nuevamente.");
    const changed = await client.auth.updateUser({ password: data.password });
    if (changed.error) throw new Error("No se pudo cambiar la contraseña.");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin
      .from("reporter_profiles" as never)
      .update({ must_change_password: false } as never)
      .eq("user_id", session.data.userId!);
    await session.update({ mustChangePassword: false });
    return { success: true };
  });

const reporterInput = z.object({
  username: z.string().regex(/^[a-z0-9]+(\.[a-z0-9]+)+$/),
  full_name: z.string().trim().min(1).max(120),
  user_id: z.string().uuid().optional(),
  active: z.boolean().optional(),
});
export const reporterAdminData = createServerFn({ method: "GET" }).handler(async () => {
  const { requireAdminSession } = await import("./admin-session.server");
  await requireAdminSession();
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const result = await supabaseAdmin
    .from("reporter_profiles" as never)
    .select("*")
    .order("full_name");
  if (result.error) throw new Error("No se pudieron consultar los reportadores.");
  return result.data ?? [];
});
export const createReporter = createServerFn({ method: "POST" })
  .inputValidator(reporterInput.omit({ user_id: true, active: true }))
  .handler(async ({ data }) => {
    const { requireAdminSession } = await import("./admin-session.server");
    await requireAdminSession();
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const created = await supabaseAdmin.auth.admin.createUser({
      email: emailFor(data.username),
      password: temporaryPassword(),
      email_confirm: true,
    });
    if (created.error || !created.data.user) throw new Error("No se pudo crear el usuario.");
    const profile = await supabaseAdmin
      .from("reporter_profiles" as never)
      .insert({
        user_id: created.data.user.id,
        username: data.username,
        full_name: data.full_name,
        active: true,
        must_change_password: true,
      } as never);
    if (profile.error) {
      await supabaseAdmin.auth.admin.deleteUser(created.data.user.id);
      throw new Error("No se pudo guardar el perfil del usuario.");
    }
    return { success: true };
  });
export const resetReporterPassword = createServerFn({ method: "POST" })
  .inputValidator(z.object({ user_id: z.string().uuid() }))
  .handler(async ({ data }) => {
    const { requireAdminSession } = await import("./admin-session.server");
    await requireAdminSession();
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const reset = await supabaseAdmin.auth.admin.updateUserById(data.user_id, {
      password: temporaryPassword(),
    });
    if (reset.error) throw new Error("No se pudo restablecer la contraseña.");
    await supabaseAdmin
      .from("reporter_profiles" as never)
      .update({ must_change_password: true } as never)
      .eq("user_id", data.user_id);
    return { success: true };
  });
export const toggleReporter = createServerFn({ method: "POST" })
  .inputValidator(z.object({ user_id: z.string().uuid(), active: z.boolean() }))
  .handler(async ({ data }) => {
    const { requireAdminSession } = await import("./admin-session.server");
    await requireAdminSession();
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const result = await supabaseAdmin
      .from("reporter_profiles" as never)
      .update({ active: data.active } as never)
      .eq("user_id", data.user_id);
    if (result.error) throw new Error("No se pudo actualizar el usuario.");
    return { success: true };
  });
