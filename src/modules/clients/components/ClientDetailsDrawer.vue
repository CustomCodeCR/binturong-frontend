<script setup lang="ts">
import { ref, onMounted, computed, watch } from "vue";
import { useI18n } from "vue-i18n";
import { 
  Mail, Phone, User, Building2, MapPin, 
  Paperclip, Users, Plus, Trash2, Star, Edit2
} from "lucide-vue-next";

// Stores y Servicios
import { ClientsService } from "@/core/services/clientsService";
import { useModalStore } from "@/core/stores/modalStore";
import { useDrawerStore } from "@/core/stores/drawerStore";
import { useToastStore } from "@/core/stores/toastStore";

// Interfaces y Componentes
import type { Client, ClientContact } from "@/core/interfaces/clients";
import ClientContactModal from "./ClientContactModal.vue";

const props = defineProps<{ clientId: string }>();
const { t } = useI18n();
const drawerStore = useDrawerStore();
const modalStore = useModalStore();
const toastStore = useToastStore();

// --- ESTADOS ---
const activeTab = ref<"details" | "financial" | "contacts" | "attachments">("details");
const loadingClient = ref(false);
const uploadingFile = ref(false);
const client = ref<Client | null>(null);

// Estados para Archivos
const attachmentDocumentType = ref("");
const attachmentFile = ref<File | null>(null);
const dragOver = ref(false);

// --- COMPUTED ---
const displayName = computed(() => client.value?.tradeName || client.value?.legalName || "Detalles del Cliente");

// --- MÉTODOS ---
async function loadClient() {
  loadingClient.value = true;
  try {
    client.value = await ClientsService.readById(props.clientId);
  } catch {
    toastStore.addToast({ severity: "error", title: "Error", message: "No se pudo cargar el cliente" });
  } finally {
    loadingClient.value = false;
  }
}

// Gestión de Contactos
function openCreateContactModal() {
  modalStore.open({
    component: ClientContactModal,
    props: {
      clientId: props.clientId,
      contact: null,
    },
    onSuccess: async () => {
      toastStore.addToast({ severity: "success", title: "Éxito", message: "Contacto creado" });
      await loadClient();
    },
  });
}

function openEditContactModal(contact: ClientContact) {
  modalStore.open({
    component: ClientContactModal,
    props: {
      clientId: props.clientId,
      contact: contact,
    },
    onSuccess: async () => {
      toastStore.addToast({ severity: "success", title: "Éxito", message: "Contacto actualizado" });
      await loadClient();
    },
  });
}

async function deleteContact(contactId: string) {
  if (!confirm("¿Eliminar este contacto?")) return;
  try {
    await ClientsService.deleteContact(props.clientId, contactId);
    toastStore.addToast({ severity: "success", title: "Éxito", message: "Contacto eliminado" });
    await loadClient();
  } catch {
    toastStore.addToast({ severity: "error", title: "Error", message: "No se pudo eliminar" });
  }
}

async function setPrimaryContact(contactId: string) {
  try {
    await ClientsService.setPrimaryContact(props.clientId, contactId);
    await loadClient();
  } catch {
    toastStore.addToast({ severity: "error", title: "Error", message: "Error al actualizar principal" });
  }
}

// Gestión de Archivos
function handleFileSelect(event: Event) {
  const input = event.target as HTMLInputElement;
  attachmentFile.value = input.files?.[0] ?? null;
}

function onDrop(event: DragEvent) {
  dragOver.value = false;
  attachmentFile.value = event.dataTransfer?.files?.[0] ?? null;
}

async function uploadAttachment() {
  if (!attachmentFile.value || !attachmentDocumentType.value) return;
  uploadingFile.value = true;
  try {
    await ClientsService.addAttachment(props.clientId, attachmentFile.value, attachmentDocumentType.value);
    toastStore.addToast({ severity: "success", title: "Éxito", message: "Archivo subido" });
    attachmentFile.value = null;
    attachmentDocumentType.value = "";
    await loadClient();
  } finally {
    uploadingFile.value = false;
  }
}

function closeDrawer() {
  drawerStore.closeDrawer();
}

onMounted(loadClient);
watch(() => props.clientId, loadClient);
</script>

<template>
  <div class="h-full bg-white flex flex-col">
    <header class="p-6 border-b shrink-0 bg-white">
      <div class="flex items-start justify-between mb-6">
        <div class="flex items-center gap-4">
          <div class="p-3 bg-slate-100 rounded-xl text-slate-700">
            <Building2 :size="28" />
          </div>
          <div>
            <h2 class="text-xl font-bold text-slate-900">{{ displayName }}</h2>
            <div class="flex gap-2 mt-1">
              <span class="text-xs font-medium px-2 py-0.5 bg-gray-100 text-gray-600 rounded">
                ID: {{ client?.identification || '---' }}
              </span>
              <span v-if="client?.isActive" class="text-xs font-bold px-2 py-0.5 bg-green-100 text-green-700 rounded uppercase tracking-tighter">
                Activo
              </span>
            </div>
          </div>
        </div>
        <button @click="closeDrawer" class="p-2 hover:bg-gray-100 rounded-full transition">
          <Plus class="rotate-45 text-gray-400" />
        </button>
      </div>

      <div class="flex gap-2 overflow-x-auto no-scrollbar">
        <button 
          v-for="tab in ['details', 'financial', 'contacts', 'attachments']" 
          :key="tab"
          @click="activeTab = tab as any"
          :class="[activeTab === tab ? 'bg-slate-700 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200']"
          class="px-4 py-2 rounded-md text-sm font-medium transition capitalize"
        >
          {{ tab === 'details' ? 'Información' : tab === 'financial' ? 'Financiero' : tab === 'contacts' ? 'Contactos' : 'Archivos' }}
        </button>
      </div>
    </header>

    <main class="flex-1 overflow-y-auto p-6 bg-slate-50">
      <div v-if="loadingClient" class="flex justify-center py-10 italic text-gray-400">Cargando...</div>
      
      <template v-else-if="client">
        <div v-if="activeTab === 'details'" class="space-y-6">
          <div class="grid grid-cols-2 gap-4">
            <div v-for="(label, key) in { email: 'Email', primaryPhone: 'Teléfono', industry: 'Industria', clientType: 'Tipo Cliente' }" :key="key" class="p-4 bg-white border rounded-lg shadow-sm">
              <p class="text-[10px] text-gray-400 uppercase font-bold mb-1">{{ label }}</p>
              <p class="text-sm font-medium text-slate-700">{{ (client as any)[key] || '-' }}</p>
            </div>
          </div>
          
          <div class="space-y-3">
            <h3 class="text-sm font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
              <MapPin :size="16"/> Direcciones
            </h3>
            <div v-for="addr in client.addresses" :key="addr.addressId" class="p-4 bg-white border rounded-lg flex justify-between items-center shadow-sm">
              <div class="flex gap-3 italic">
                <div class="mt-1 text-slate-300"><MapPin :size="18"/></div>
                <div>
                  <p class="text-sm font-bold text-slate-700">{{ addr.addressLine }}</p>
                  <p class="text-xs text-gray-500">{{ addr.province }}, {{ addr.district }}</p>
                </div>
              </div>
              <span v-if="addr.isPrimary" class="text-[9px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded font-bold uppercase">Principal</span>
            </div>
          </div>
        </div>

        <div v-if="activeTab === 'financial'" class="space-y-6">
          <div class="bg-slate-700 p-6 rounded-2xl text-white shadow-lg">
            <p class="text-xs opacity-70 uppercase font-bold">Saldo Pendiente Total</p>
            <p class="text-3xl font-black mt-1">${{ client.kpis?.outstandingBalance?.toLocaleString() || 0 }}</p>
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div class="p-4 bg-white border rounded-lg text-center shadow-sm">
              <p class="text-xs text-gray-400 font-bold mb-1">Score Credito</p>
              <p class="text-xl font-bold text-slate-700">{{ client.score }}/100</p>
            </div>
            <div class="p-4 bg-white border rounded-lg text-center shadow-sm">
              <p class="text-xs text-gray-400 font-bold mb-1">Facturado 90d</p>
              <p class="text-xl font-bold text-green-600">${{ client.kpis?.totalInvoicedLast90Days?.toLocaleString() || 0 }}</p>
            </div>
          </div>
        </div>

        <div v-if="activeTab === 'contacts'" class="space-y-4">
          <div class="flex justify-between items-center">
            <h3 class="text-sm font-bold text-gray-400 uppercase">Contactos Registrados</h3>
            <button @click="openCreateContactModal" class="flex items-center gap-1 text-xs font-bold bg-[#C6983A] text-white px-3 py-1.5 rounded-md shadow-sm">
              <Plus :size="14"/> Nuevo
            </button>
          </div>

          <div v-if="client.contacts?.length" class="space-y-3">
            <div v-for="contact in client.contacts" :key="contact.contactId" class="p-4 bg-white border rounded-xl shadow-sm flex justify-between items-start transition hover:border-slate-300">
              <div class="flex gap-3">
                <div class="mt-1 p-2 bg-slate-50 rounded-lg text-slate-400"><User :size="18" /></div>
                <div>
                  <div class="flex items-center gap-2">
                    <p class="font-bold text-slate-700 leading-none">{{ contact.name }}</p>
                    <Star v-if="contact.isPrimary" :size="12" class="fill-amber-400 text-amber-400" />
                  </div>
                  <p class="text-[11px] text-gray-400 font-bold uppercase mt-1">{{ contact.jobTitle }}</p>
                  <div class="flex flex-col gap-0.5 mt-2">
                    <span class="text-xs text-slate-500 flex items-center gap-1"><Mail :size="12"/> {{ contact.email }}</span>
                    <span class="text-xs text-slate-500 flex items-center gap-1"><Phone :size="12"/> {{ contact.phone }}</span>
                  </div>
                </div>
              </div>
              <div class="flex gap-1">
                <button v-if="!contact.isPrimary" @click="setPrimaryContact(contact.contactId)" class="p-1.5 text-gray-300 hover:text-amber-500 transition"><Star :size="16"/></button>
                <button @click="openEditContactModal(contact)" class="p-1.5 text-gray-300 hover:text-slate-600 transition"><Edit2 :size="16"/></button>
                <button @click="deleteContact(contact.contactId)" class="p-1.5 text-gray-300 hover:text-red-500 transition"><Trash2 :size="16"/></button>
              </div>
            </div>
          </div>
          <div v-else class="py-12 text-center border-2 border-dashed rounded-2xl bg-white text-gray-400 italic text-sm">
            <Users :size="40" class="mx-auto mb-2 opacity-20" /> Sin contactos registrados.
          </div>
        </div>

        <div v-if="activeTab === 'attachments'" class="space-y-6">
          <div class="border-2 border-dashed p-8 rounded-2xl transition-all text-center bg-white" :class="dragOver ? 'border-slate-700 bg-slate-50' : 'border-gray-200'">
            <Paperclip :size="32" class="mx-auto text-gray-300 mb-2" />
            <p class="text-sm font-bold text-slate-700">{{ attachmentFile ? attachmentFile.name : 'Arrastra archivos aquí' }}</p>
            <input type="file" @change="handleFileSelect" class="mt-4 text-xs mx-auto block text-gray-400" />
          </div>

          <div v-if="attachmentFile" class="space-y-4 bg-white p-4 rounded-xl border shadow-sm">
            <input v-model="attachmentDocumentType" placeholder="Tipo de documento..." class="w-full border p-2 rounded text-sm outline-none focus:ring-1 focus:ring-slate-700" />
            <button @click="uploadAttachment" :disabled="uploadingFile" class="w-full py-2 bg-slate-700 text-white rounded-md font-bold text-sm disabled:opacity-50">
              {{ uploadingFile ? 'Subiendo...' : 'Subir Archivo' }}
            </button>
          </div>
        </div>
      </template>
    </main>
  </div>
</template>

<style scoped>
.no-scrollbar::-webkit-scrollbar { display: none; }
.no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
</style>