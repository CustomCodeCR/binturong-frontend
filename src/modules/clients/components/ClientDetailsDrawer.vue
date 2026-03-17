<script setup lang="ts">
import { ref, onMounted } from "vue";
import { Mail, Phone, User, Building2, MapPin, BadgeDollarSign, Globe } from "lucide-vue-next";
import { ClientsService } from "@/core/services/clientsService";
import type { Client } from "@/core/interfaces/clients";

const props = defineProps<{ clientId: string }>();
const client = ref<Client | null>(null);
const loading = ref(true);

onMounted(async () => {
  try {
    client.value = await ClientsService.readById(props.clientId);
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <div class="h-full flex flex-col bg-white">
    <div v-if="loading" class="flex-1 flex items-center justify-center p-6 text-bt-grey-500">
      <span class="animate-pulse">Cargando información detallada...</span>
    </div>
    
    <div v-else-if="client" class="flex-1 overflow-y-auto p-6 space-y-8">
      <header class="border-b pb-6">
        <div class="flex items-center gap-3 mb-2">
          <div class="p-2 bg-bt-primary-50 rounded-lg text-bt-primary-600">
            <Building2 :size="24" />
          </div>
          <h2 class="text-xl font-bold text-bt-primary-700">{{ client.tradeName }}</h2>
        </div>
        <div class="flex gap-2">
          <span class="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full font-medium">
            {{ client.identificationType }}: {{ client.identification }}
          </span>
          <span :class="[
            'px-2 py-1 text-xs rounded-full font-medium',
            client.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
          ]">
            {{ client.isActive ? 'Activo' : 'Inactivo' }}
          </span>
        </div>
      </header>

      <section>
        <h3 class="flex items-center gap-2 font-bold text-sm uppercase tracking-wider text-gray-400 mb-4">
          <User :size="16" /> Información de Contacto
        </h3>
        <div class="grid grid-cols-2 gap-6">
          <div class="space-y-1">
            <p class="text-xs text-gray-500">Nombre de Contacto</p>
            <p class="text-sm font-medium">{{ client.contactName || 'No definido' }}</p>
          </div>
          <div class="space-y-1">
            <p class="text-xs text-gray-500">Email Principal</p>
            <p class="text-sm font-medium flex items-center gap-1">
              <Mail :size="14" class="text-gray-400" /> {{ client.email }}
            </p>
          </div>
          <div class="space-y-1">
            <p class="text-xs text-gray-500">Teléfono Primario</p>
            <p class="text-sm font-medium flex items-center gap-1">
              <Phone :size="14" class="text-gray-400" /> {{ client.primaryPhone }}
            </p>
          </div>
          <div class="space-y-1">
            <p class="text-xs text-gray-500">Teléfono Secundario</p>
            <p class="text-sm font-medium">{{ client.secondaryPhone || '-' }}</p>
          </div>
          <div class="space-y-1">
            <p class="text-xs text-gray-500">Industria / Sector</p>
            <p class="text-sm font-medium">{{ client.industry }}</p>
          </div>
          <div class="space-y-1">
            <p class="text-xs text-gray-500">Tipo de Cliente</p>
            <p class="text-sm font-medium">{{ client.clientType }}</p>
          </div>
        </div>
      </section>

      <section class="bg-bt-grey-50 border border-bt-grey-200 p-5 rounded-xl">
        <h3 class="flex items-center gap-2 font-bold text-bt-primary-700 mb-4">
          <BadgeDollarSign :size="18" /> Resumen Financiero
        </h3>
        <div class="grid grid-cols-2 gap-4">
          <div class="bg-white p-4 rounded-lg border border-gray-100 shadow-sm">
            <p class="text-xs text-gray-500 mb-1">Saldo Pendiente</p>
            <p class="text-lg font-bold text-bt-primary-700">
              ${{ client.kpis.outstandingBalance.toLocaleString('en-US', { minimumFractionDigits: 2 }) }}
            </p>
          </div>
          <div class="bg-white p-4 rounded-lg border border-gray-100 shadow-sm">
            <p class="text-xs text-gray-500 mb-1">Facturado (90 días)</p>
            <p class="text-lg font-bold text-green-600">
              ${{ client.kpis.totalInvoicedLast90Days.toLocaleString('en-US', { minimumFractionDigits: 2 }) }}
            </p>
          </div>
          <div class="col-span-2 bg-slate-700 p-3 rounded-lg text-white flex justify-between items-center">
            <span class="text-sm font-medium">Score de Crédito</span>
            <span class="text-lg font-bold">{{ client.score }} / 100</span>
          </div>
        </div>
      </section>

      <section>
        <h3 class="flex items-center gap-2 font-bold text-sm uppercase tracking-wider text-gray-400 mb-4">
          <MapPin :size="16" /> Direcciones Registradas
        </h3>
        <div class="space-y-3">
          <div v-for="addr in client.addresses" :key="addr.addressId" 
               class="flex gap-3 p-3 border rounded-lg hover:bg-gray-50 transition">
            <MapPin :size="18" class="text-bt-primary-400 shrink-0 mt-1" />
            <div>
              <p class="text-sm font-medium text-bt-primary-700">{{ addr.addressLine }}</p>
              <p class="text-xs text-gray-500">{{ addr.district }}, {{ addr.province }}</p>
            </div>
          </div>
          <p v-if="!client.addresses.length" class="text-sm text-gray-400 italic">No hay direcciones registradas.</p>
        </div>
      </section>
    </div>
  </div>
</template>