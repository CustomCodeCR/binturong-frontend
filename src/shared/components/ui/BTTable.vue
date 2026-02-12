<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import BTButton from '@/components/ui/BTButton.vue'
import BTListboxSelect from '@/components/ui/BTListBoxSelect.vue'
import {
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  Search,
  Bird,
  LoaderCircle,
} from 'lucide-vue-next'
// Nota: Si no tienes este icono, puedes usar RefreshCcw de lucide-vue-next
//import RefreshCCW from '@/components/icons/RefreshCCW.vue'

interface PageSizeOptions {
  id: number
  label: string
}
interface Header {
  key: number | string
  label: string
  size?: number
  sortable?: boolean
}
interface TableData {
  headers: Header[]
  rows: Record<string, any>[]
}
interface Filter {
  key: string
  value: any
  filterFunction?: (rowValue: any, filterValue: any) => boolean
}
interface Props {
  tableData?: TableData
  filters?: Filter[]
  isLoading?: boolean
  loadingTitle?: string
  loadingMessage?: string
  emptyStateTittle?: string
  emptyStateMessage?: string
  showPaginationControls?: boolean
  showHeaders?: boolean
  headerWrapperClasses?: string
  showToolbars?: boolean
  showSearch?: boolean
  showPageSizeSelector?: boolean
  pageSizeSelectorOptions?: number[]
  pageSize?: number
  startPage?: number
  searchInputID?: string
  searchInputName?: string
  searchInputPlaceholder?: string
  minColumnWidth?: string
  maxColumnWidth?: string
  minRowHeight?: string
  maxRowHeight?: string
  scrollOverflow?: boolean
  emptyActionText?: string
  showEmptyAction?: boolean
  allowEmptyActionToggle?: boolean
}

const emit = defineEmits<{
  (e: 'empty-action'): void
  (e: 'empty-action-toggle', value: boolean): void
}>()

const props = withDefaults(defineProps<Props>(), {
  tableData: () => ({ headers: [], rows: [] }),
  filters: () => [],
  isLoading: false,
  loadingTitle: 'Loading...',
  loadingMessage: "Retrieving table's records",
  emptyStateTittle: 'No Records',
  emptyStateMessage: 'This table does not contain any records.',
  showPaginationControls: false,
  showHeaders: true,
  headerWrapperClasses: '',
  showToolbars: false,
  showSearch: true,
  showPageSizeSelector: false,
  pageSizeSelectorOptions: () => [10, 25, 50, 75, 100],
  pageSize: 5,
  startPage: 1,
  searchInputID: 'searchInput' + Math.random().toString().slice(2),
  searchInputName: 'searchInput' + Math.random().toString().slice(2),
  searchInputPlaceholder: 'Keyword Search',
  minColumnWidth: '80px',
  maxColumnWidth: '1fr',
  minRowHeight: '50px',
  maxRowHeight: '1fr',
  scrollOverflow: true,
  emptyActionText: 'Create',
  showEmptyAction: true,
  allowEmptyActionToggle: false,
})

// Lógica de estado y filtros
const isEmpty = () => props.tableData.rows.length <= 0 || props.tableData.headers.length <= 0
const tableState = computed(() => {
  if (props.isLoading) return 'loading'
  if (isEmpty()) return 'empty'
  return 'working'
})

const searchInput = ref<HTMLInputElement | null>(null)
const focusSearchInput = () => searchInput.value?.focus()

const filteredRows = computed(() => {
  return props.tableData.rows.filter((row) => {
    return props.filters?.every((filter) => {
      const rowValue = row[filter.key]
      const filterValue = filter.value
      if (filter.filterFunction) return filter.filterFunction(rowValue, filterValue)
      return rowValue === filterValue
    })
  })
})

const searchQuery = ref('')
const searchFilteredRows = computed(() => {
  if (!searchQuery.value.trim()) return filteredRows.value
  const lower = searchQuery.value.toLowerCase()
  return filteredRows.value.filter((row) =>
    Object.values(row).some((v) => String(v).toLowerCase().includes(lower)),
  )
})

// Paginación y Ordenamiento
const currentPage = ref<number>(props.startPage)
const pageSizeSelectorOptions = computed(() => {
  if (!props.pageSizeSelectorOptions || props.pageSizeSelectorOptions.length <= 0) {
    return [ { id: 25, label: '25' }, { id: 50, label: '50' } ]
  }
  return props.pageSizeSelectorOptions.map(v => ({ id: v, label: v.toString() }))
})
const pageSizeSelector = ref(pageSizeSelectorOptions.value[0])
const pageSizeSetting = computed(() => (props.showPageSizeSelector ? pageSizeSelector.value.id : props.pageSize))

const amountColumns = computed(() => props.tableData.headers.reduce((sum, header) => sum + (header.size ?? 1), 0))
const totalPages = computed(() => Math.ceil(searchFilteredRows.value.length / pageSizeSetting.value) || 1)
const paginateRows = computed(() => {
  const start = (currentPage.value - 1) * pageSizeSetting.value
  return sortedRows.value.slice(start, start + pageSizeSetting.value)
})

const sortedRows = computed(() => {
  const rows = [...searchFilteredRows.value]
  if (!currentSortKey.value) return rows
  return rows.sort((a, b) => {
    const aValue = a[currentSortKey.value!]
    const bValue = b[currentSortKey.value!]
    const modifier = currentSortDirection.value === 'asc' ? 1 : -1
    return aValue > bValue ? modifier : -modifier
  })
})

const currentSortDirection = ref<'asc' | 'desc' | null>(null)
const currentSortKey = ref<string | number | null>(null)

function sortColumn(key: string | number) {
  if (currentSortKey.value === key) {
    currentSortDirection.value = currentSortDirection.value === 'asc' ? 'desc' : 'asc'
  } else {
    currentSortKey.value = key
    currentSortDirection.value = 'asc'
  }
}

function goToPage(page: number) { currentPage.value = page }
</script>

<template>
  <div class="no-scrollbar flex w-full flex-col">
    <div v-if="props.showToolbars" class="flex flex-row flex-wrap items-center justify-between gap-4 pb-4">
      <div v-if="props.showSearch" class="w-full max-w-[250px]">
        <div class="flex h-8 w-full cursor-pointer items-center gap-4 rounded-full border border-bt-grey-400 bg-white px-2.5" @click="focusSearchInput">
          <Search :size="12" class="text-bt-grey-600" />
          <input ref="searchInput" v-model="searchQuery" class="text-[14px] w-full outline-none placeholder:text-bt-grey-600" type="text" :placeholder="props.searchInputPlaceholder" />
        </div>
      </div>
      <div class="flex items-center gap-4">
        <slot name="filters" />
        <div v-if="showPageSizeSelector" class="flex items-center gap-1">
          <span class="text-sm text-bt-grey-700">Show:</span>
          <BTListboxSelect size="pss" variant="box-only" v-model="pageSizeSelector" :options="pageSizeSelectorOptions" />
        </div>
      </div>
    </div>

    <div class="relative flex w-full flex-col overflow-y-auto rounded-md border border-bt-grey-300 no-scrollbar">
      <div v-if="props.showHeaders" class="hidden sm:grid w-full border-b border-bt-grey-300" 
           :style="`grid-template-columns: repeat(${amountColumns}, minmax(${props.minColumnWidth},${props.maxColumnWidth}));` ">
        <div v-for="(header, index) in props.tableData.headers" :key="header.key"
             class="flex items-center bg-bt-primary-50 px-2 py-4"
             :class="[`col-span-${header.size ?? 1}`, index !== 0 ? 'border-l border-bt-grey-300' : '']"
             @click="header.sortable && sortColumn(header.key)">
          <div class="flex items-center gap-2 font-semibold text-bt-secondary-800 text-sm">
            {{ header.label }}
            <ChevronsUpDown v-if="header.sortable" :size="14" />
          </div>
        </div>
      </div>

      <div class="grid w-full divide-y divide-bt-grey-200" :class="{ 'pattern': tableState === 'empty' }">
        <div v-for="row in paginateRows" :key="row.id" 
             class="grid w-full hover:bg-bt-grey-50 transition-colors"
             :style="`grid-template-columns: repeat(${amountColumns}, minmax(${props.minColumnWidth},${props.maxColumnWidth}));` ">
          <div v-for="(col, colIndex) in props.tableData.headers" :key="col.key"
               class="flex items-center px-2 py-4 text-sm"
               :class="[`col-span-${col.size ?? 1}`, colIndex !== 0 ? 'border-l border-bt-grey-200' : '']">
            <slot :name="col.key" :row="row">
              <span class="text-bt-grey-700">{{ row[col.key] }}</span>
            </slot>
          </div>
        </div>
      </div>

      <div v-if="tableState === 'loading'" class="p-20 flex justify-center"><LoaderCircle class="animate-spin text-bt-primary-500" :size="48" /></div>
      <div v-if="tableState === 'empty'" class="p-20 flex flex-col items-center gap-2">
        <Bird :size="48" class="text-bt-grey-400" />
        <p class="text-bt-grey-600 font-medium">{{ props.emptyStateTittle }}</p>
      </div>
    </div>

    <div v-if="props.showPaginationControls" class="flex items-center justify-center gap-4 p-4">
      <BTButton variant="icon" size="xs" :disabled="currentPage === 1" @click="currentPage--">
        <template #icon><ChevronLeft /></template>
      </BTButton>
      <span class="text-sm text-bt-grey-600">Page {{ currentPage }} of {{ totalPages }}</span>
      <BTButton variant="icon" size="xs" :disabled="currentPage === totalPages" @click="currentPage++">
        <template #icon><ChevronRight /></template>
      </BTButton>
    </div>
  </div>
</template>

<style scoped>
.no-scrollbar::-webkit-scrollbar { display: none; }
.pattern {
  --s: 21px; --c1: #ffffff; --c2: #fcfcfd;
  background: linear-gradient(135deg, #0000 20.5%, var(--c1) 0 29.5%, #0000 0) 0 calc(var(--s) / 4), var(--c2);
  background-size: var(--s) var(--s);
}
</style>