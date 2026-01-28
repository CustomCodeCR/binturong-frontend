<script setup lang="ts">
import { ref, computed } from "vue";
//import BTLayoutDash from '@/components/layout/BTLayoutDash.vue'
//import BTHeader from '@/components/ui/BTHeader.vue'
import BTTableB from '@/components/ui/BTTableB.vue'
import BTListboxSelect from '@/components/ui/BTListBoxSelect.vue'
import BTButton from '@/components/ui/BTButton.vue'
import { 
  Eye, 
  Check, 
  X, 
  RotateCcw, 
  UserPlus, 
  FileDown 
} from "lucide-vue-next";

/* --- CONFIGURACIÓN DE COLUMNAS --- */
const tableData = computed(() => ({
  headers: [
    { key: "applicationId", label: "ID", size: 1 },
    { key: "fullName", label: "Member Name", size: 2 },
    { key: "status", label: "Status", size: 1.2, centered: true },
    { key: "documentType", label: "Document", size: 1.5 },
    { key: "priority", label: "Priority", size: 1, centered: true },
    { key: "submittedDate", label: "Date", size: 1.2 },
    { key: "actions", label: "Actions", size: 1.2, sticky: true },
  ],
  rows: tableRows.value.map(row => ({
    ...row,
    fullName: `${row.firstName} ${row.lastName}`
  }))
}));

/* --- DATOS (Simulando API) --- */
const tableRows = ref([
  { applicationId: "KYC-001", firstName: "Diego", lastName: "Araya", status: "Pending", documentType: "Passport", priority: "High", submittedDate: "2024-03-20T10:30:00" },
  { applicationId: "KYC-002", firstName: "Ana", lastName: "Rojas", status: "Approved", documentType: "National ID", priority: "Low", submittedDate: "2024-03-19T15:45:00" },
  { applicationId: "KYC-003", firstName: "Carlos", lastName: "Pérez", status: "In Review", documentType: "Driver License", priority: "Medium", submittedDate: "2024-03-21T09:00:00" },
]);

/* --- FILTROS --- */
const statusOptions = [
  { id: 'all', label: 'All Status' },
  { id: 'Pending', label: 'Pending' },
  { id: 'In Review', label: 'In Review' },
  { id: 'Approved', label: 'Approved' },
  { id: 'Rejected', label: 'Rejected' },
];
const selectedStatus = ref(statusOptions[0]);

const tableFilters = computed(() => {
  if (selectedStatus.value.id === 'all') return [];
  return [{ key: 'status', value: selectedStatus.value.id }];
});

/* --- MÉTODOS --- */
const handleAction = (type: string, id: string) => console.log(`Action ${type} on ${id}`);
const resetFilters = () => { selectedStatus.value = statusOptions[0]; };
</script>

<template>
  <BTLayoutDash :rows="2">
    <template #header>
      <BTHeader>
        <template #title>User Directory</template>
        <template #description>Manage member verifications and account statuses.</template>

        <template #action>
          <div class="flex items-center gap-2">
            <BTButton variant="secondary" size="sm">
              <template #icon><FileDown :size="16" /></template>
              Export
            </BTButton>
            <BTButton variant="primary" size="sm">
              <template #icon><UserPlus :size="16" /></template>
              Add User
            </BTButton>
          </div>
        </template>
      </BTHeader>
    </template>

    <template #row1A>
      <div class="flex flex-col gap-4">
        <div class="flex items-center justify-between bg-white p-1 rounded-lg">
          <div class="flex items-center gap-3">
            <span class="text-sm font-medium text-bt-grey-600">Filter by:</span>
            <BTListboxSelect
              v-model="selectedStatus"
              :options="statusOptions"
              size="sm"
              class="w-48"
            />
            <BTButton 
              v-if="selectedStatus.id !== 'all'"
              variant="tertiary" 
              size="xs" 
              @click="resetFilters"
            >
              <template #icon><RotateCcw :size="14" /></template>
              Clear
            </BTButton>
          </div>
        </div>

        <BTTableB 
          :table-data="tableData"
          :filters="tableFilters"
          show-toolbars
          show-search
          show-pagination-controls
          selectable
          class="shadow-sm border border-bt-grey-200 rounded-xl"
        >
          <template #status="{ row }">
            <div 
              class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold"
              :class="{
                'bg-blue-100 text-blue-700': row.status === 'Pending',
                'bg-green-100 text-green-700': row.status === 'Approved',
                'bg-yellow-100 text-yellow-700': row.status === 'In Review',
                'bg-red-100 text-red-700': row.status === 'Rejected',
              }"
            >
              {{ row.status }}
            </div>
          </template>

          <template #priority="{ row }">
            <div 
              class="text-[10px] font-bold uppercase px-2 py-1 rounded border"
              :class="row.priority === 'High' ? 'border-red-200 text-red-600 bg-red-50' : 'border-bt-grey-200 text-bt-grey-500'"
            >
              {{ row.priority }}
            </div>
          </template>

          <template #actions="{ row }">
            <div class="flex items-center justify-end gap-1">
              <BTButton variant="icon" size="xs" title="View Details" @click="handleAction('view', row.applicationId)">
                <template #icon><Eye :size="16" class="text-bt-primary-600" /></template>
              </BTButton>
              <BTButton variant="icon" size="xs" title="Approve" @click="handleAction('approve', row.applicationId)">
                <template #icon><Check :size="16" class="text-green-600" /></template>
              </BTButton>
              <BTButton variant="icon" size="xs" title="Reject" @click="handleAction('reject', row.applicationId)">
                <template #icon><X :size="16" class="text-red-600" /></template>
              </BTButton>
            </div>
          </template>
        </BTTableB>
      </div>
    </template>
  </BTLayoutDash>
</template>