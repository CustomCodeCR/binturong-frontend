<script setup lang="ts">
import {
  Listbox,
  ListboxButton,
  ListboxLabel,
  ListboxOption,
  ListboxOptions,
} from '@headlessui/vue'
import { Check, ChevronDown } from 'lucide-vue-next'

interface Option {
  id: string | number | boolean
  label: string
}

interface Props {
  modelValue: Option
  options: Option[]
  label?: string
  placeholder?: string
  disabled?: boolean
  size?: 'sm' | 'md' | 'pss' // pss es el tamaño especial para la tabla
  variant?: 'default' | 'box-only'
}

const props = withDefaults(defineProps<Props>(), {
  label: '',
  placeholder: 'Select an option',
  disabled: false,
  size: 'md',
  variant: 'default',
})

const emit = defineEmits(['update:modelValue'])

const onSelect = (value: Option) => {
  emit('update:modelValue', value)
}

// Mapeo de tamaños para las clases de Tailwind
const sizeClasses = {
  sm: 'py-1 px-3 text-xs',
  md: 'py-2 px-4 text-sm',
  pss: 'py-1 px-2 text-[12px] min-w-[60px]', // Ajuste perfecto para el "Show 25"
}
</script>

<template>
  <div class="w-full">
    <Listbox
      :model-value="props.modelValue"
      :disabled="props.disabled"
      @update:model-value="onSelect"
    >
      <ListboxLabel v-if="props.label" class="bt-text-label mb-1 block text-bt-grey-700">
        {{ props.label }}
      </ListboxLabel>

      <div class="relative">
        <ListboxButton
          class="relative w-full cursor-pointer rounded-lg border border-bt-grey-300 bg-white text-left transition-all focus:outline-none focus:ring-2 focus:ring-bt-primary-500/20 disabled:cursor-not-allowed disabled:bg-bt-grey-100"
          :class="sizeClasses[props.size]"
        >
          <span class="block truncate" :class="!props.modelValue ? 'text-bt-grey-400' : 'text-bt-grey-900'">
            {{ props.modelValue?.label || props.placeholder }}
          </span>
          <span class="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
            <ChevronDown class="h-4 w-4 text-bt-grey-400" aria-hidden="true" />
          </span>
        </ListboxButton>

        <transition
          leave-active-class="transition duration-100 ease-in"
          leave-from-class="opacity-100"
          leave-to-class="opacity-0"
        >
          <ListboxOptions
            class="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-sm shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none"
          >
            <ListboxOption
              v-for="option in props.options"
              :key="String(option.id)"
              v-slot="{ active, selected }"
              :value="option"
              as="template"
            >
              <li
                :class="[
                  active ? 'bg-bt-primary-50 text-bt-primary-900' : 'text-bt-grey-900',
                  'relative cursor-pointer select-none py-2 pl-10 pr-4',
                ]"
              >
                <span :class="[selected ? 'font-medium' : 'font-normal', 'block truncate']">
                  {{ option.label }}
                </span>
                <span
                  v-if="selected"
                  class="absolute inset-y-0 left-0 flex items-center pl-3 text-bt-primary-600"
                >
                  <Check class="h-4 w-4" aria-hidden="true" />
                </span>
              </li>
            </ListboxOption>
          </ListboxOptions>
        </transition>
      </div>
    </Listbox>
  </div>
</template>