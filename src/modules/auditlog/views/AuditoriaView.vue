<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import {
  History,
  Search,
  FileText,
  Download,
  LayoutGrid,
  Info,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-vue-next";
import { AuditService } from "@/core/services/auditService";
import type { AuditLog, AuditBrowseQuery } from "@/core/interfaces/audit";
import { useToastStore } from "@/core/stores/toastStore";

const toastStore = useToastStore();
const logs = ref<AuditLog[]>([]);
const loading = ref(false);

// --- PAGINACIÓN ---
const currentPage = ref(1);
const itemsPerPage = 10;

const totalPages = computed(() => Math.ceil(logs.value.length / itemsPerPage));
const paginatedLogs = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage;
  return logs.value.slice(start, start + itemsPerPage);
});

// --- FILTROS ---
const filters = ref({
  from: "",
  to: "",
  module: "",
  action: "",
});

// --- MODAL ---
const selectedLog = ref<AuditLog | null>(null);
const showDetailModal = ref(false);

/**
 * Formatea la fecha para el backend.
 * .NET y PostgreSQL prefieren el formato ISO8601 con tiempo explícito.
 */
function formatToBackendDate(
  dateStr: string,
  isEndOfDay: boolean = false,
): string | undefined {
  if (!dateStr) return undefined;
  return isEndOfDay ? `${dateStr}T23:59:59Z` : `${dateStr}T00:00:00Z`;
}

async function fetchLogs() {
  loading.value = true;
  currentPage.value = 1;

  try {
    const query: AuditBrowseQuery = {
      from: formatToBackendDate(filters.value.from),
      to: formatToBackendDate(filters.value.to, true),
      module: filters.value.module || undefined,
      action: filters.value.action || undefined,
    };

    // Usamos tu AuditService.browse tal cual está definido
    const response = await AuditService.browse(query);

    // Validamos que sea un array para evitar errores de renderizado
    logs.value = Array.isArray(response) ? response : [];
  } catch (error) {
    console.error("Error fetching logs:", error);
    toastStore.addToast({
      severity: "error",
      title: "Error de Carga",
      message:
        "El servidor no respondió correctamente. Revisa el UserId en el backend.",
    });
    logs.value = [];
  } finally {
    loading.value = false;
  }
}

function formatDate(dateStr: string) {
  if (!dateStr) return "N/A";
  const date = new Date(dateStr);
  return date.toLocaleString("es-CR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

function parseJson(data: string | null) {
  if (!data) return "N/A";
  try {
    // Si ya es un objeto (JSON.parsed por axios), lo devolvemos formateado
    if (typeof data === "object") return JSON.stringify(data, null, 2);
    return JSON.stringify(JSON.parse(data), null, 2);
  } catch {
    return data;
  }
}

onMounted(fetchLogs);
</script>

<template>
  <div class="p-8 space-y-8 max-w-[1600px] mx-auto">
    <header
      class="flex flex-col md:flex-row md:items-center justify-between gap-4"
    >
      <div>
        <div class="flex items-center gap-3 mb-1">
          <div class="p-2 bg-slate-800 rounded-lg text-white shadow-lg">
            <History :size="24" />
          </div>
          <h1
            class="text-2xl font-black text-slate-800 tracking-tight uppercase"
          >
            Registro de Auditoría
          </h1>
        </div>
        <p class="text-gray-400 text-sm font-medium">
          Monitoreo de cambios y actividad del sistema.
        </p>
      </div>

      <div class="flex items-center gap-2">
        <button
          @click="
            () => {
              /* Lógica para exportar Excel */
            }
          "
          class="flex items-center gap-2 px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl text-xs font-black transition shadow-lg shadow-green-900/20"
        >
          <Download :size="16" /> EXCEL
        </button>
        <button
          @click="
            () => {
              /* Lógica para exportar PDF */
            }
          "
          class="flex items-center gap-2 px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-black transition shadow-lg shadow-red-900/20"
        >
          <FileText :size="16" /> PDF
        </button>
      </div>
    </header>

    <section
      class="grid grid-cols-1 md:grid-cols-5 gap-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm"
    >
      <div v-for="label in ['Desde', 'Hasta']" :key="label" class="space-y-1">
        <label
          class="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1"
          >{{ label }}</label
        >
        <input
          v-model="filters[label === 'Desde' ? 'from' : 'to']"
          type="date"
          class="w-full px-4 py-2.5 rounded-xl border border-gray-100 bg-slate-50/50 text-sm focus:ring-2 focus:ring-slate-800 outline-none transition"
        />
      </div>

      <div class="space-y-1">
        <label
          class="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1"
          >Módulo</label
        >
        <select
          v-model="filters.module"
          class="w-full px-4 py-2.5 rounded-xl border border-gray-100 bg-slate-50/50 text-sm focus:ring-2 focus:ring-slate-800 outline-none transition"
        >
          <option value="">Todos los módulos</option>
          <option value="Taxes">Impuestos</option>
          <option value="Products">Productos</option>
          <option value="Auth">Seguridad</option>
          <option value="Inventory">Inventario</option>
        </select>
      </div>

      <div class="space-y-1">
        <label
          class="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1"
          >Acción</label
        >
        <select
          v-model="filters.action"
          class="w-full px-4 py-2.5 rounded-xl border border-gray-100 bg-slate-50/50 text-sm focus:ring-2 focus:ring-slate-800 outline-none transition"
        >
          <option value="">Todas las acciones</option>
          <option value="Create">Creación</option>
          <option value="Update">Actualización</option>
          <option value="Delete">Eliminación</option>
        </select>
      </div>

      <div class="flex items-end">
        <button
          @click="fetchLogs"
          :disabled="loading"
          class="w-full py-2.5 bg-slate-800 text-white rounded-xl font-black text-xs hover:bg-slate-900 transition flex items-center justify-center gap-2 shadow-lg"
        >
          <Search :size="16" /> {{ loading ? "BUSCANDO..." : "FILTRAR" }}
        </button>
      </div>
    </section>

    <div
      class="bg-white rounded-2xl border border-slate-100 shadow-xl shadow-slate-200/50 overflow-hidden min-h-[400px]"
    >
      <table class="w-full text-left border-collapse">
        <thead>
          <tr class="bg-slate-50/50 border-b border-slate-100">
            <th
              class="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest"
            >
              Fecha y Hora
            </th>
            <th
              class="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest"
            >
              Entidad
            </th>
            <th
              class="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center"
            >
              Acción
            </th>
            <th
              class="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest"
            >
              Usuario
            </th>
            <th
              class="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right"
            >
              Detalles
            </th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-50">
          <tr v-if="loading">
            <td colspan="5" class="px-6 py-20 text-center">
              <div class="flex flex-col items-center gap-3">
                <div
                  class="w-8 h-8 border-4 border-slate-800 border-t-transparent rounded-full animate-spin"
                ></div>
                <span
                  class="text-xs font-black text-slate-400 uppercase tracking-widest"
                  >Obteniendo Auditoría...</span
                >
              </div>
            </td>
          </tr>
          <tr v-else-if="logs.length === 0">
            <td colspan="5" class="px-6 py-20 text-center text-gray-400 italic">
              No hay registros disponibles.
            </td>
          </tr>
          <tr
            v-for="log in paginatedLogs"
            :key="log.auditId"
            class="hover:bg-slate-50/80 transition-colors group"
          >
            <td class="px-6 py-4">
              <div class="flex flex-col">
                <span class="text-sm font-bold text-slate-700">{{
                  formatDate(log.eventDate).split(",")[0]
                }}</span>
                <span class="text-[11px] text-gray-400 font-medium">{{
                  formatDate(log.eventDate).split(",")[1]
                }}</span>
              </div>
            </td>
            <td class="px-6 py-4">
              <div class="flex items-center gap-3">
                <div
                  class="p-2 bg-slate-100 rounded-lg text-slate-500 group-hover:bg-white transition-colors"
                >
                  <LayoutGrid :size="14" />
                </div>
                <div>
                  <p class="text-sm font-bold text-slate-700 leading-tight">
                    {{ log.module }}
                  </p>
                  <p
                    class="text-[11px] text-gray-400 font-bold uppercase tracking-tighter"
                  >
                    {{ log.entity }} #{{ log.entityId }}
                  </p>
                </div>
              </div>
            </td>
            <td class="px-6 py-4 text-center">
              <span
                class="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest"
                :class="
                  log.action === 'Create'
                    ? 'bg-green-100 text-green-700'
                    : log.action === 'Update'
                      ? 'bg-amber-100 text-amber-700'
                      : 'bg-red-100 text-red-700'
                "
              >
                {{ log.action }}
              </span>
            </td>
            <td class="px-6 py-4">
              <div class="flex flex-col text-sm text-slate-600">
                <span class="font-bold">User: {{ log.userId }}</span>
                <span class="text-[10px] text-gray-400 font-mono">{{
                  log.ip || "0.0.0.0"
                }}</span>
              </div>
            </td>
            <td class="px-6 py-4 text-right">
              <button
                @click="
                  selectedLog = log;
                  showDetailModal = true;
                "
                class="text-[11px] font-black text-[#C6983A] hover:text-[#b08733] transition uppercase flex items-center gap-1.5 ml-auto"
              >
                <Info :size="14" /> Datos
              </button>
            </td>
          </tr>
        </tbody>
      </table>

      <div
        class="p-4 border-t bg-slate-50/30 flex justify-between items-center"
      >
        <span
          class="text-[10px] font-black text-gray-400 uppercase ml-2 tracking-widest"
          >Total: {{ logs.length }}</span
        >
        <div class="flex items-center gap-6">
          <button
            @click="currentPage--"
            :disabled="currentPage === 1"
            class="p-2 text-slate-400 hover:text-slate-800 disabled:opacity-20 transition"
          >
            <ChevronLeft :size="20" />
          </button>
          <span class="text-xs font-black text-slate-700 uppercase"
            >Página {{ currentPage }} de {{ totalPages || 1 }}</span
          >
          <button
            @click="currentPage++"
            :disabled="currentPage === totalPages || totalPages === 0"
            class="p-2 text-slate-400 hover:text-slate-800 disabled:opacity-20 transition"
          >
            <ChevronRight :size="20" />
          </button>
        </div>
      </div>
    </div>

    <div
      v-if="showDetailModal"
      class="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/70 backdrop-blur-md"
    >
      <div
        class="bg-white rounded-3xl w-full max-w-5xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200"
      >
        <header
          class="p-6 border-b flex justify-between items-center bg-slate-50/50"
        >
          <h3 class="font-black text-slate-800 text-lg uppercase leading-none">
            Detalles del Cambio
          </h3>
          <button
            @click="showDetailModal = false"
            class="p-2 hover:bg-white rounded-full transition shadow-sm border border-transparent hover:border-slate-100"
          >
            <X :size="20" class="text-gray-400" />
          </button>
        </header>
        <main
          class="flex-1 overflow-y-auto p-8 grid grid-cols-1 md:grid-cols-2 gap-8 bg-white"
        >
          <div
            v-for="s in ['dataBefore', 'dataAfter']"
            :key="s"
            class="space-y-3"
          >
            <h4
              class="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2"
            >
              <span
                class="w-2 h-2 rounded-full"
                :class="s === 'dataBefore' ? 'bg-slate-300' : 'bg-amber-400'"
              ></span>
              {{ s === "dataBefore" ? "Estado Anterior" : "Estado Nuevo" }}
            </h4>
            <div
              :class="
                s === 'dataBefore'
                  ? 'bg-slate-50 border-slate-100'
                  : 'bg-amber-50/20 border-amber-100'
              "
              class="p-5 rounded-2xl border font-mono text-[11px] text-slate-600 min-h-[300px] overflow-auto shadow-inner"
            >
              <pre class="leading-relaxed">{{
                parseJson(selectedLog?.[s as keyof AuditLog] || null)
              }}</pre>
            </div>
          </div>
        </main>
      </div>
    </div>
  </div>
</template>

<style scoped>
pre {
  white-space: pre-wrap;
  word-break: break-all;
}
</style>
