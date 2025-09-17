"use server"

import { createServerClient } from "@/lib/supabase/server"
import { getCurrentCompanyId } from "@/lib/session/company"

export async function softDeleteItem(tableName: string, recordId: string, reason?: string) {
  const supabase = createServerClient()
  const companyId = await getCurrentCompanyId()

  try {
    const { data, error } = await supabase.rpc("soft_delete_record", {
      p_table_name: tableName,
      p_record_id: recordId,
      p_delete_reason: reason,
    })

    if (error) throw error

    return { success: data }
  } catch (error) {
    console.error("Erro ao excluir item:", error)
    throw new Error("Falha ao excluir item")
  }
}

export async function restoreItem(tableName: string, recordId: string) {
  const supabase = createServerClient()
  const companyId = await getCurrentCompanyId()

  try {
    const { data, error } = await supabase.rpc("restore_record", {
      p_table_name: tableName,
      p_record_id: recordId,
    })

    if (error) throw error

    return { success: data }
  } catch (error) {
    console.error("Erro ao restaurar item:", error)
    throw new Error("Falha ao restaurar item")
  }
}

export async function permanentDeleteItem(tableName: string, recordId: string) {
  const supabase = createServerClient()
  const companyId = await getCurrentCompanyId()

  try {
    const { data, error } = await supabase.rpc("permanent_delete_record", {
      p_table_name: tableName,
      p_record_id: recordId,
    })

    if (error) throw error

    return { success: data }
  } catch (error) {
    console.error("Erro ao excluir permanentemente:", error)
    throw new Error("Falha ao excluir permanentemente")
  }
}

export async function getTrashItems() {
  const supabase = createServerClient()
  const companyId = await getCurrentCompanyId()

  try {
    const { data, error } = await supabase
      .from("trash_log")
      .select(`
        *,
        user:deleted_by(
          email,
          raw_user_meta_data
        )
      `)
      .eq("company_id", companyId)
      .is("restored_at", null)
      .order("deleted_at", { ascending: false })

    if (error) throw error

    return (data || []).map((item) => ({
      ...item,
      user_name: item.user?.raw_user_meta_data?.full_name || item.user?.email || "Usuário desconhecido",
    }))
  } catch (error) {
    console.error("Erro ao buscar itens da lixeira:", error)
    throw new Error("Falha ao buscar itens da lixeira")
  }
}

export async function cleanupOldTrash() {
  const supabase = createServerClient()

  try {
    const { data, error } = await supabase.rpc("cleanup_old_trash")

    if (error) throw error

    return { cleaned_count: data }
  } catch (error) {
    console.error("Erro ao limpar lixeira:", error)
    throw new Error("Falha ao limpar lixeira")
  }
}

export async function getTrashStats() {
  const supabase = createServerClient()
  const companyId = await getCurrentCompanyId()

  try {
    const { data, error } = await supabase
      .from("trash_log")
      .select("table_name")
      .eq("company_id", companyId)
      .is("restored_at", null)

    if (error) throw error

    const stats = (data || []).reduce(
      (acc, item) => {
        acc[item.table_name] = (acc[item.table_name] || 0) + 1
        return acc
      },
      {} as Record<string, number>,
    )

    return stats
  } catch (error) {
    console.error("Erro ao buscar estatísticas da lixeira:", error)
    return {}
  }
}
