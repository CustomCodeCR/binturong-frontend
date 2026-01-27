<script setup lang="ts">
import { ref, computed } from "vue";
// Importamos los iconos directamente (asegúrate de tener lucide-vue-next instalado)
import {
  Eye,
  Check,
  X,
  MessageSquare,
  RotateCcw,
  ChevronDown,
} from "lucide-vue-next";

/* --- TIPOS --- */
type KycPriority = "High" | "Medium" | "Low";
type KycStatus = "Pending" | "In Review" | "Approved" | "Rejected";

/* --- DATOS LOCALES --- */
const tableRows = ref([
  {
    applicationId: "KYC-001",
    firstName: "Diego",
    lastName: "Araya",
    status: "Pending",
    documentType: "Passport",
    priority: "High",
    submittedDate: "2024-03-20T10:30:00",
  },
  {
    applicationId: "KYC-002",
    firstName: "Ana",
    lastName: "Rojas",
    status: "Approved",
    documentType: "National ID",
    priority: "Low",
    submittedDate: "2024-03-19T15:45:00",
  },
  {
    applicationId: "KYC-003",
    firstName: "Carlos",
    lastName: "Pérez",
    status: "In Review",
    documentType: "Driver License",
    priority: "Medium",
    submittedDate: "2024-03-21T09:00:00",
  },
]);

/* --- FILTROS --- */
const statusOptions = ["", "Pending", "In Review", "Approved", "Rejected"];
const selectedStatus = ref("");

const filteredRows = computed(() => {
  if (!selectedStatus.value) return tableRows.value;
  return tableRows.value.filter((row) => row.status === selectedStatus.value);
});

/* --- ESTILOS DINÁMICOS (Badges) --- */
const getPriorityClass = (priority: string) => {
  if (priority === "High")
    return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
  if (priority === "Medium")
    return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
  return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
};

const getStatusClass = (status: string) => {
  if (status === "Approved")
    return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
  if (status === "Pending")
    return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
  if (status === "Rejected")
    return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
  return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
};

/* --- ACCIONES --- */
const handleAction = (action: string, id: string) => {
  console.log(`${action} ejecutado para: ${id}`);
};
</script>

<template>
  <div
    class="p-4 antialiased text-gray-900 bg-gray-50 dark:bg-gray-900 min-h-screen"
  >
    <div
      class="max-w-7xl mx-auto bg-white dark:bg-gray-800 shadow-md rounded-lg overflow-hidden"
    >
      <div
        class="p-4 border-b dark:border-gray-700 flex flex-wrap items-center justify-between gap-4"
      >
        <h2 class="text-xl font-bold dark:text-white">
          KYC Verification Queue
        </h2>

        <div class="flex items-center gap-3">
          <select
            v-model="selectedStatus"
            class="bg-gray-50 border border-gray-300 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          >
            <option value="">Todos los estados</option>
            <option
              v-for="status in statusOptions.slice(1)"
              :key="status"
              :value="status"
            >
              {{ status }}
            </option>
          </select>

          <button
            @click="selectedStatus = ''"
            class="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700"
          >
            <RotateCcw :size="16" /> Reset
          </button>
        </div>
      </div>

      <div class="overflow-x-auto">
        <table
          class="w-full text-sm text-left text-gray-500 dark:text-gray-400"
        >
          <thead
            class="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400"
          >
            <tr>
              <th class="px-6 py-3">Application ID</th>
              <th class="px-6 py-3">Name</th>
              <th class="px-6 py-3">Status</th>
              <th class="px-6 py-3">Doc Type</th>
              <th class="px-6 py-3">Priority</th>
              <th class="px-6 py-3">Date</th>
              <th class="px-6 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="row in filteredRows"
              :key="row.applicationId"
              class="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
            >
              <td class="px-6 py-4 font-medium text-gray-900 dark:text-white">
                {{ row.applicationId }}
              </td>
              <td class="px-6 py-4">{{ row.firstName }} {{ row.lastName }}</td>
              <td class="px-6 py-4">
                <span
                  :class="[
                    'px-2.5 py-0.5 rounded-full text-xs font-medium',
                    getStatusClass(row.status),
                  ]"
                >
                  {{ row.status }}
                </span>
              </td>
              <td class="px-6 py-4">{{ row.documentType }}</td>
              <td class="px-6 py-4">
                <span
                  :class="[
                    'px-2.5 py-0.5 rounded text-xs font-semibold',
                    getPriorityClass(row.priority),
                  ]"
                >
                  {{ row.priority }}
                </span>
              </td>
              <td class="px-6 py-4 text-xs">
                {{ new Date(row.submittedDate).toLocaleDateString() }}
              </td>
              <td class="px-6 py-4 text-right">
                <div class="flex justify-end gap-2">
                  <button
                    @click="handleAction('view', row.applicationId)"
                    class="p-2 text-blue-600 hover:bg-blue-50 rounded-lg dark:text-blue-500 dark:hover:bg-gray-700"
                    title="Review"
                  >
                    <Eye :size="18" />
                  </button>
                  <button
                    @click="handleAction('approve', row.applicationId)"
                    class="p-2 text-green-600 hover:bg-green-50 rounded-lg dark:text-green-500 dark:hover:bg-gray-700"
                    title="Approve"
                  >
                    <Check :size="18" />
                  </button>
                  <button
                    @click="handleAction('reject', row.applicationId)"
                    class="p-2 text-red-600 hover:bg-red-50 rounded-lg dark:text-red-500 dark:hover:bg-gray-700"
                    title="Reject"
                  >
                    <X :size="18" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div
        class="p-4 border-t dark:border-gray-700 flex justify-between items-center text-sm text-gray-600 dark:text-gray-400"
      >
        <span>Mostrando {{ filteredRows.length }} registros</span>
        <div class="flex gap-1">
          <button
            class="px-3 py-1 border rounded hover:bg-gray-100 dark:border-gray-600"
          >
            Anterior
          </button>
          <button
            class="px-3 py-1 border rounded hover:bg-gray-100 dark:border-gray-600"
          >
            Siguiente
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
