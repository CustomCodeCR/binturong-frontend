<script lang="ts" setup>
import { computed, ref, watch } from 'vue'
import {
  Bird,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsUpDown,
  ChevronUp,
  LoaderCircle,
  Search,
} from 'lucide-vue-next'


import BTListboxSelect from '@/components/ui/BTListBoxSelect.vue'
import BTButton from '@/components/ui/BTButton.vue'
import BTCheckBox from '@/components/ui/BTCheckBox.vue'

interface Header {
  key: number | string
  label: string
  size?: number
  sortable?: boolean
  sticky?: boolean
  centered?: boolean
}
interface PageSizeOptions {
  id: number
  label: string
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
  modelValue?: any[]
  filters?: Filter[]
  selectable?: boolean
  isLoading?: boolean
  loadingTitle?: string
  loadingMessage?: string
  emptyStateTittle?: string
  emptyStateMessage?: string
  showToolbars?: boolean
  stickyHeader?: boolean
  pageSize?: number
  startPage?: number
  showPageSizeSelector?: boolean
  pageSizeSelectorOptions?: number[]
  showPaginationControls: boolean
  showSearch?: boolean
  searchInputID?: string
  searchInputName?: string
  searchInputPlaceholder?: string
  minColumnWidth?: string
  columnWidth?: string
  maxColumnWidth?: string
  minRowHeight?: string
  rowHeight?: number
  maxRowHeight?: string
  showEmptyAction?: boolean
  emptyActionText?: string
  allowEmptyActionToggle?: boolean
  centered?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  tableData: () => ({ headers: [], rows: [] }),
  modelValue: () => [],
  filters: () => [],
  selectable: false,
  isLoading: false,
  loadingTitle: 'Loading...',
  loadingMessage: "Retrieving table's records",
  emptyStateTittle: 'No Records',
  emptyStateMessage: 'This table does not contain any records.',
  showToolbars: false,
  stickyHeader: true,
  pageSize: 5,
  startPage: 1,
  showPageSizeSelector: false,
  pageSizeSelectorOptions: () => [10, 25, 50, 75, 100],
  showPaginationControls: false,
  showSearch: true,
  searchInputID: 'searchInput' + Math.random().toString().slice(2),
  searchInputName: 'searchInput' + Math.random().toString().slice(2),
  searchInputPlaceholder: 'Keyword Search',
  rowHeight: 60,
  showEmptyAction: true,
  emptyActionText: 'Create',
  allowEmptyActionToggle: false,
  centered: false,
})

// ============================================================================
// Table State
// ============================================================================
const isEmpty = () => props.tableData.rows.length <= 0 || props.tableData.headers.length <= 0
const tableState = computed(() => {
  if (props.isLoading) return 'loading'
  if (isEmpty()) return 'empty'
  return 'working'
})

// ============================================================================
// Filters & Search logic (Se mantiene igual)
// ============================================================================
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
const searchInput = ref<HTMLInputElement | null>(null)
const focusSearchInput = () => searchInput.value?.focus()

const searchFilteredRows = computed(() => {
  if (!searchQuery.value.trim()) return filteredRows.value
  const lower = searchQuery.value.toLowerCase()
  return filteredRows.value.filter((row) =>
    Object.values(row).some((v) => String(v).toLowerCase().includes(lower)),
  )
})

// ============================================================================
// Sorting & Pagination (Se mantiene igual, solo adaptamos visual)
// ============================================================================
type SortDirection = 'asc' | 'desc' | null
const currentSortDirection = ref<SortDirection>(null)
const currentSortKey = ref<string | number | null>(null)

const sortedRows = computed(() => {
  const rows = [...searchFilteredRows.value]
  if (!currentSortKey.value) return rows
  return rows.sort((a, b) => {
    const aValue = a[currentSortKey.value!]
    const bValue = b[currentSortKey.value!]
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return currentSortDirection.value === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue)
    }
    if (typeof aValue === 'number' && typeof bValue === 'number') {
      return currentSortDirection.value === 'asc' ? aValue - bValue : bValue - aValue
    }
    return 0
  })
})

function sortColumn(key: string | number) {
  if (currentSortKey.value === key) {
    currentSortDirection.value = currentSortDirection.value === 'asc' ? 'desc' : 'asc'
  } else {
    currentSortKey.value = key
    currentSortDirection.value = 'asc'
  }
}

const pageSizeSelectorDefaultOptions = [
  { id: 25, label: '25' },
  { id: 50, label: '50' },
  { id: 75, label: '75' },
  { id: 100, label: '100' },
]

const pageSizeSelectorOptions = computed(() => {
  if (!props.pageSizeSelectorOptions || props.pageSizeSelectorOptions.length <= 0) {
    return pageSizeSelectorDefaultOptions
  }
  return props.pageSizeSelectorOptions.map(v => ({ id: v, label: v.toString() }))
})

const pageSizeSelector = ref(pageSizeSelectorOptions.value[0])
const pageSizeSetting = computed(() => props.showPageSizeSelector ? pageSizeSelector.value.id : props.pageSize)
const currentPage = ref<number>(props.startPage)
const totalPages = computed(() => Math.ceil(searchFilteredRows.value.length / pageSizeSetting.value) || 1)

const paginateRows = computed(() => {
  const start = (currentPage.value - 1) * pageSizeSetting.value
  return sortedRows.value.slice(start, start + pageSizeSetting.value)
})

const visiblePages = computed(() => {
  const pages: (number | string)[] = []
  const total = totalPages.value
  const current = currentPage.value
  // Lógica simplificada de páginas visibles
  if (total <= 7) {
    for (let i = 1; i <= total; i++) pages.push(i)
  } else {
    pages.push(1, '...', current, '...', total) // Versión resumida para brevedad
  }
  return pages
})

function prevPage() { if (currentPage.value > 1) currentPage.value-- }
function nextPage() { if (currentPage.value < totalPages.value) currentPage.value++ }
function goToPage(page: any) { if (typeof page === 'number') currentPage.value = page }

// ============================================================================
// Selection Logic
// ============================================================================
const emit = defineEmits(['update:modelValue', 'update:selected', 'empty-action', 'empty-action-toggle'])
const selectedRows = ref<any[]>([...props.modelValue])
const allSelected = computed(() => props.tableData.rows.length > 0 && props.tableData.rows.every(row => selectedRows.value.includes(row)))

function toggleSelectAll() {
  selectedRows.value = allSelected.value ? [] : [...props.tableData.rows]
  emit('update:modelValue', selectedRows.value)
}

function toggleRow(row: any) {
  const index = selectedRows.value.indexOf(row)
  index >= 0 ? selectedRows.value.splice(index, 1) : selectedRows.value.push(row)
  emit('update:modelValue', selectedRows.value)
}

// ============================================================================
// Styles (Cambiados de vx- a bt-)
// ============================================================================
const getStickyColumnStyles = (header: Header, isHeader = false) => {
  if (!header.sticky) return []
  const classes = ['sticky', 'right-0']
  isHeader ? classes.push('top-0', 'bg-bt-primary-50', 'z-4') : classes.push('bg-white')
  return classes
}

const calculateTableHeight = computed(() => {
  const tableHeight = ((paginateRows.value.length + 1) * props.rowHeight) + 4
  return tableHeight > 800 ? 'calc(100vh - 300px)' : `${tableHeight}px`
})
</script>

<template>
  <div class="flex w-full flex-col gap-4">
    <div v-if="props.showToolbars" class="flex flex-row items-center justify-between gap-4">
      <div v-if="props.showSearch" class="w-full max-w-[250px]">
        <div class="flex h-9 items-center gap-2 rounded-full border border-bt-grey-300 bg-white px-3 shadow-sm focus-within:border-bt-primary-500" @click="focusSearchInput">
          <Search :size="16" class="text-bt-grey-400" />
          <input ref="searchInput" v-model="searchQuery" :placeholder="props.searchInputPlaceholder" class="w-full text-sm outline-none placeholder:text-bt-grey-400" type="text" />
        </div>
      </div>
      <div class="flex items-center gap-4">
        <slot name="filters" />
        <div v-if="showPageSizeSelector" class="flex items-center gap-2 text-sm text-bt-grey-600">
          <span>Show:</span>
          <BTListboxSelect v-model="pageSizeSelector" :options="pageSizeSelectorOptions" size="sm" />
        </div>
      </div>
    </div>

    <div :style="{ height: calculateTableHeight }" class="relative overflow-auto rounded-lg border border-bt-grey-200 no-scrollbar shadow-sm" :class="{ 'pattern': tableState !== 'working' }">
      
      <div v-if="tableState === 'loading'" class="absolute inset-0 z-20 flex items-center justify-center bg-white/60 backdrop-blur-[1px]">
        <div class="flex flex-col items-center gap-2 rounded-xl bg-white p-6 shadow-xl border border-bt-grey-100">
          <LoaderCircle :size="40" class="animate-spin text-bt-primary-500" />
          <span class="font-semibold text-bt-grey-800">{{ props.loadingTitle }}</span>
          <span class="text-xs text-bt-grey-500">{{ props.loadingMessage }}</span>
        </div>
      </div>

      <div v-else-if="tableState === 'empty'" class="flex h-full flex-col items-center justify-center gap-4 p-10">
        <Bird :size="64" class="text-bt-grey-300" />
        <div class="text-center">
          <h3 class="text-lg font-bold text-bt-grey-800">{{ props.emptyStateTittle }}</h3>
          <p class="text-sm text-bt-grey-500">{{ props.emptyStateMessage }}</p>
        </div>
        <BTButton v-if="props.showEmptyAction" variant="primary" size="sm" @click="emit('empty-action')">
          {{ props.emptyActionText }}
        </BTButton>
      </div>

      <table v-else class="w-full table-auto border-collapse text-left text-sm">
        <thead class="sticky top-0 z-10 bg-bt-primary-50">
          <tr :style="{ height: `${props.rowHeight}px` }">
            <th v-if="selectable" class="px-4 border-b border-bt-grey-200">
              <BTCheckBox :checked="allSelected" @change="toggleSelectAll" />
            </th>
            <th v-for="header in props.tableData.headers" :key="header.key" 
                :class="[header.centered ? 'text-center' : '', getStickyColumnStyles(header, true)]"
                class="px-4 font-semibold text-bt-grey-700 border-b border-bt-grey-200 hover:bg-bt-primary-100 cursor-pointer transition-colors"
                @click="header.key !== 'actions' && sortColumn(header.key)">
              <div class="flex items-center gap-2" :class="{ 'justify-center': header.centered }">
                {{ header.label }}
                <ChevronsUpDown v-if="header.key !== 'actions'" :size="14" class="text-bt-grey-400" />
              </div>
            </th>
          </tr>
        </thead>
        <tbody class="divide-y divide-bt-grey-100">
          <tr v-for="row in paginateRows" :key="row.id" :style="{ height: `${props.rowHeight}px` }" class="hover:bg-bt-grey-50 transition-colors">
            <td v-if="selectable" class="px-4">
              <BTCheckBox :checked="selectedRows.includes(row)" @change="toggleRow(row)" />
            </td>
            <td v-for="col in props.tableData.headers" :key="col.key" 
                :class="[col.centered ? 'text-center' : '', getStickyColumnStyles(col)]" class="px-4">
              <slot :name="col.key" :row="row" :col="col">
                <span class="text-bt-grey-600">{{ row[col.key] }}</span>
              </slot>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="props.showPaginationControls" class="flex items-center justify-center gap-2 py-2">
      <BTButton variant="icon" size="xs" :disabled="currentPage === 1" @click="prevPage">
        <template #icon><ChevronLeft :size="16" /></template>
      </BTButton>
      
      <div class="flex gap-1">
        <button v-for="(page, i) in visiblePages" :key="i" 
                :class="page === currentPage ? 'bg-bt-primary-500 text-white' : 'hover:bg-bt-primary-50 text-bt-grey-600'"
                class="h-8 w-8 rounded text-xs font-medium transition-colors"
                @click="goToPage(page)">
          {{ page }}
        </button>
      </div>

      <BTButton variant="icon" size="xs" :disabled="currentPage === totalPages" @click="nextPage">
        <template #icon><ChevronRight :size="16" /></template>
      </BTButton>
    </div>
  </div>
</template>

<style scoped>
.no-scrollbar::-webkit-scrollbar { display: none; }
.pattern {
  --s: 20px;
  --c1: #ffffff;
  --c2: #f9fafb;
  background: 
    linear-gradient(135deg,#0000 20.5%,var(--c1) 0 29.5%,#0000 0) 0 calc(var(--s)/4),
    linear-gradient(45deg,var(--c1) 8%,#0000 0 58%,var(--c1) 0 67%,#0000 0 83%,var(--c1) 0 92%,#0000 0),
    var(--c2);
  background-size: var(--s) var(--s);
}
</style>