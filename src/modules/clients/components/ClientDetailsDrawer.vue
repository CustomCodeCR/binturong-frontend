<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { useDrawerStore } from "@/core/stores/drawerStore";
import { useModalStore } from "@/core/stores/modalStore";
import { useToastStore } from "@/core/stores/toastStore";
import { ClientsService } from "@/core/services/clientsService"; 

const props = defineProps<{
  clientId: string;
}>();

const { t } = useI18n();
const drawerStore = useDrawerStore();
const toastStore = useToastStore();

const activeTab = ref<"details" | "contacts" | "addresses" | "attachments">("details");
const loading = ref(false);
const client = ref<any>(null); // Usamos any o tu interfaz Client

async function loadData() {
  loading.value = true;
  try {
    // Usamos el método que tienes en tu service
    client.value = await ClientsService.readById(props.clientId);
  } catch (error) {
    toastStore.addToast({ severity: "error", title: t("toast.error"), message: "Error al cargar" });
  } finally {
    loading.value = false;
  }
}

async function removeContact(contactId: string) {
  try {
    await ClientsService.deleteContact(props.clientId, contactId);
    await loadData();
  } catch {
    toastStore.addToast({ severity: "error", title: t("toast.error"), message: "Error al eliminar" });
  }
}

onMounted(loadData);
watch(() => props.clientId, loadData);
</script>

<template>
  <div class="h-full bg-bt-white p-bt-spacing-24 overflow-y-auto">
    <div class="flex justify-between items-center mb-bt-spacing-24">
      <h2 class="text-xl font-bt-bold text-bt-primary-700">{{ $t("clients.drawer.title") }}</h2>
      <button class="bg-bt-grey-200 px-bt-spacing-12 py-bt-spacing-8 rounded-m" @click="drawerStore.closeDrawer">
        {{ $t("common.close") }}
      </button>
    </div>

    <div class="flex gap-bt-spacing-8 mb-bt-spacing-24">
      <button v-for="tab in ['details', 'contacts', 'addresses', 'attachments']" :key="tab"
              @click="activeTab = tab as any"
              :class="activeTab === tab ? 'bg-bt-primary-500 text-bt-white' : 'bg-bt-grey-200'"
              class="px-bt-spacing-16 py-bt-spacing-8 rounded-m">
        {{ tab.toUpperCase() }}
      </button>
    </div>

    <div v-if="loading" class="text-center">{{ $t("common.loading") }}</div>

    <div v-else-if="client" class="space-y-bt-spacing-24">
      
      <div v-if="activeTab === 'details'" class="grid grid-cols-2 gap-bt-spacing-16">
        <div v-for="(val, key) in client" :key="key" class="p-bt-spacing-16 border rounded-m">
          <p class="text-xs text-bt-grey-500 capitalize">{{ key }}</p>
          <p class="font-bt-semibold">{{ val }}</p>
        </div>
      </div>

      <div v-else-if="activeTab === 'contacts'">
        <div v-for="contact in client.contacts" :key="contact.contactId" class="flex justify-between p-bt-spacing-16 border-b">
          <span>{{ contact.name }}</span>
          <button @click="removeContact(contact.contactId)" class="text-bt-error-600">Eliminar</button>
        </div>
      </div>
      
    </div>
  </div>
</template>