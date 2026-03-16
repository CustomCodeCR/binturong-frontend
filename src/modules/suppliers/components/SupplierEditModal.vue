<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useI18n } from "vue-i18n";

import { useModalStore } from "@/core/stores/modalStore";
import { SuppliersService } from "@/core/services/suppliersService";

import type { Supplier } from "@/core/interfaces/suppliers";

const props = defineProps<{
  supplierId: string;
}>();

const { t } = useI18n();
const modalStore = useModalStore();

const loading = ref(false);
const saving = ref(false);

const supplier = ref<Supplier | null>(null);

const legalName = ref("");
const tradeName = ref("");
const email = ref("");
const phone = ref("");
const paymentTerms = ref("");
const mainCurrency = ref("");
const isActive = ref(true);

function closeModal() {
  modalStore.close();
}

async function loadSupplier() {
  loading.value = true;

  try {
    const response = await SuppliersService.readById(props.supplierId);
    supplier.value = response;

    legalName.value = response.legalName;
    tradeName.value = response.tradeName;
    email.value = response.email;
    phone.value = response.phone;
    paymentTerms.value = response.paymentTerms;
    mainCurrency.value = response.mainCurrency;
    isActive.value = response.isActive;
  } finally {
    loading.value = false;
  }
}

async function submit() {
  if (!supplier.value) return;

  if (
    !legalName.value.trim() ||
    !tradeName.value.trim() ||
    !email.value.trim() ||
    !phone.value.trim() ||
    !paymentTerms.value.trim() ||
    !mainCurrency.value.trim()
  ) {
    modalStore.onError?.({
      code: 400,
      message: t("suppliers.validation.requiredUpdate"),
    });
    return;
  }

  saving.value = true;

  try {
    await SuppliersService.update(supplier.value.supplierId, {
      legalName: legalName.value.trim(),
      tradeName: tradeName.value.trim(),
      email: email.value.trim(),
      phone: phone.value.trim(),
      paymentTerms: paymentTerms.value.trim(),
      mainCurrency: mainCurrency.value.trim(),
      isActive: isActive.value,
    });

    modalStore.onSuccess?.({ ok: true });
    modalStore.close();
  } catch (error: any) {
    modalStore.onError?.({
      code: error?.status ?? 500,
      message: error?.message ?? t("suppliers.messages.updateError"),
    });
  } finally {
    saving.value = false;
  }
}

onMounted(async () => {
  await loadSupplier();
});
</script>

<template>
  <div
    class="bg-bt-white rounded-l shadow-bt-elevation-400 w-full max-w-4xl p-bt-spacing-24"
  >
    <div class="mb-bt-spacing-24">
      <h2 class="text-xl font-bt-bold text-bt-primary-700">
        {{ $t("suppliers.modal.editTitle") }}
      </h2>
      <p class="text-bt-grey-600 mt-bt-spacing-8">
        {{ $t("suppliers.modal.editDescription") }}
      </p>
    </div>

    <div v-if="loading" class="py-bt-spacing-24 text-center text-bt-grey-500">
      {{ $t("common.loading") }}
    </div>

    <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-bt-spacing-16">
      <div>
        <label class="block mb-bt-spacing-8 text-sm text-bt-primary-700">{{
          $t("suppliers.fields.legalName")
        }}</label>
        <input
          v-model="legalName"
          type="text"
          class="w-full px-bt-spacing-16 py-bt-spacing-12 rounded-m border border-bt-grey-300 focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
        />
      </div>

      <div>
        <label class="block mb-bt-spacing-8 text-sm text-bt-primary-700">{{
          $t("suppliers.fields.tradeName")
        }}</label>
        <input
          v-model="tradeName"
          type="text"
          class="w-full px-bt-spacing-16 py-bt-spacing-12 rounded-m border border-bt-grey-300 focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
        />
      </div>

      <div>
        <label class="block mb-bt-spacing-8 text-sm text-bt-primary-700">{{
          $t("suppliers.fields.email")
        }}</label>
        <input
          v-model="email"
          type="email"
          class="w-full px-bt-spacing-16 py-bt-spacing-12 rounded-m border border-bt-grey-300 focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
        />
      </div>

      <div>
        <label class="block mb-bt-spacing-8 text-sm text-bt-primary-700">{{
          $t("suppliers.fields.phone")
        }}</label>
        <input
          v-model="phone"
          type="text"
          class="w-full px-bt-spacing-16 py-bt-spacing-12 rounded-m border border-bt-grey-300 focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
        />
      </div>

      <div>
        <label class="block mb-bt-spacing-8 text-sm text-bt-primary-700">{{
          $t("suppliers.fields.paymentTerms")
        }}</label>
        <input
          v-model="paymentTerms"
          type="text"
          class="w-full px-bt-spacing-16 py-bt-spacing-12 rounded-m border border-bt-grey-300 focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
        />
      </div>

      <div>
        <label class="block mb-bt-spacing-8 text-sm text-bt-primary-700">{{
          $t("suppliers.fields.mainCurrency")
        }}</label>
        <input
          v-model="mainCurrency"
          type="text"
          class="w-full px-bt-spacing-16 py-bt-spacing-12 rounded-m border border-bt-grey-300 focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
        />
      </div>

      <div class="md:col-span-2 flex items-center gap-bt-spacing-8">
        <input v-model="isActive" type="checkbox" />
        <span class="text-bt-primary-700">{{
          $t("suppliers.fields.isActive")
        }}</span>
      </div>
    </div>

    <div class="mt-bt-spacing-24 flex justify-end gap-bt-spacing-12">
      <button
        type="button"
        class="px-bt-spacing-16 py-bt-spacing-12 rounded-m bg-bt-grey-200 text-bt-primary-700 hover:bg-bt-grey-300"
        @click="closeModal"
      >
        {{ $t("common.cancel") }}
      </button>

      <button
        type="button"
        :disabled="saving"
        class="px-bt-spacing-16 py-bt-spacing-12 rounded-m bg-bt-accent-500 text-bt-white hover:bg-bt-accent-600 disabled:bg-bt-disabled"
        @click="submit"
      >
        {{
          saving ? $t("common.loading") : $t("suppliers.actions.saveChanges")
        }}
      </button>
    </div>
  </div>
</template>
