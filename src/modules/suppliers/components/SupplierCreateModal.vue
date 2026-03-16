<script setup lang="ts">
import { ref } from "vue";
import { useI18n } from "vue-i18n";

import { useModalStore } from "@/core/stores/modalStore";
import { SuppliersService } from "@/core/services/suppliersService";

const { t } = useI18n();
const modalStore = useModalStore();

const identificationType = ref("CedulaJuridica");
const identification = ref("");
const legalName = ref("");
const tradeName = ref("");
const email = ref("");
const phone = ref("");
const paymentTerms = ref("");
const mainCurrency = ref("CRC");
const isActive = ref(true);

const loading = ref(false);

/* OPTIONS */

const identificationTypeOptions = [
  { value: "CedulaFisica", label: "Cédula Física" },
  { value: "CedulaJuridica", label: "Cédula Jurídica" },
  { value: "DIMEX", label: "DIMEX" },
  { value: "NITE", label: "NITE" },
  { value: "Pasaporte", label: "Pasaporte" },
];

const currencyOptions = [
  { value: "CRC", label: "CRC - Colón Costarricense" },
  { value: "USD", label: "USD - Dólar Estadounidense" },
  { value: "EUR", label: "EUR - Euro" },
];

/* ACTIONS */

function closeModal() {
  modalStore.close();
}

async function submit() {
  if (
    !identificationType.value.trim() ||
    !identification.value.trim() ||
    !legalName.value.trim() ||
    !tradeName.value.trim() ||
    !email.value.trim() ||
    !phone.value.trim() ||
    !paymentTerms.value.trim() ||
    !mainCurrency.value.trim()
  ) {
    modalStore.onError?.({
      code: 400,
      message: t("suppliers.validation.requiredCreate"),
    });
    return;
  }

  loading.value = true;

  try {
    const created = await SuppliersService.create({
      identificationType: identificationType.value.trim(),
      identification: identification.value.trim(),
      legalName: legalName.value.trim(),
      tradeName: tradeName.value.trim(),
      email: email.value.trim(),
      phone: phone.value.trim(),
      paymentTerms: paymentTerms.value.trim(),
      mainCurrency: mainCurrency.value.trim(),
      isActive: isActive.value,
    });

    modalStore.onSuccess?.(created);
    modalStore.close();
  } catch (error: any) {
    modalStore.onError?.({
      code: error?.status ?? 500,
      message: error?.message ?? t("suppliers.messages.createError"),
    });
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div
    class="bg-bt-white rounded-l shadow-bt-elevation-400 w-full max-w-4xl p-bt-spacing-24"
  >
    <div class="mb-bt-spacing-24">
      <h2 class="text-xl font-bt-bold text-bt-primary-700">
        {{ $t("suppliers.modal.createTitle") }}
      </h2>
      <p class="text-bt-grey-600 mt-bt-spacing-8">
        {{ $t("suppliers.modal.createDescription") }}
      </p>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-bt-spacing-16">
      <!-- Identification Type -->

      <div>
        <label class="block mb-bt-spacing-8 text-sm text-bt-primary-700">
          {{ $t("suppliers.fields.identificationType") }}
        </label>

        <select
          v-model="identificationType"
          class="w-full px-bt-spacing-16 py-bt-spacing-12 rounded-m border border-bt-grey-300 focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
        >
          <option
            v-for="opt in identificationTypeOptions"
            :key="opt.value"
            :value="opt.value"
          >
            {{ opt.label }}
          </option>
        </select>
      </div>

      <!-- Identification -->

      <div>
        <label class="block mb-bt-spacing-8 text-sm text-bt-primary-700">
          {{ $t("suppliers.fields.identification") }}
        </label>

        <input
          v-model="identification"
          type="text"
          class="w-full px-bt-spacing-16 py-bt-spacing-12 rounded-m border border-bt-grey-300 focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
        />
      </div>

      <!-- Legal Name -->

      <div>
        <label class="block mb-bt-spacing-8 text-sm text-bt-primary-700">
          {{ $t("suppliers.fields.legalName") }}
        </label>

        <input
          v-model="legalName"
          type="text"
          class="w-full px-bt-spacing-16 py-bt-spacing-12 rounded-m border border-bt-grey-300 focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
        />
      </div>

      <!-- Trade Name -->

      <div>
        <label class="block mb-bt-spacing-8 text-sm text-bt-primary-700">
          {{ $t("suppliers.fields.tradeName") }}
        </label>

        <input
          v-model="tradeName"
          type="text"
          class="w-full px-bt-spacing-16 py-bt-spacing-12 rounded-m border border-bt-grey-300 focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
        />
      </div>

      <!-- Email -->

      <div>
        <label class="block mb-bt-spacing-8 text-sm text-bt-primary-700">
          {{ $t("suppliers.fields.email") }}
        </label>

        <input
          v-model="email"
          type="email"
          class="w-full px-bt-spacing-16 py-bt-spacing-12 rounded-m border border-bt-grey-300 focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
        />
      </div>

      <!-- Phone -->

      <div>
        <label class="block mb-bt-spacing-8 text-sm text-bt-primary-700">
          {{ $t("suppliers.fields.phone") }}
        </label>

        <input
          v-model="phone"
          type="text"
          class="w-full px-bt-spacing-16 py-bt-spacing-12 rounded-m border border-bt-grey-300 focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
        />
      </div>

      <!-- Payment Terms -->

      <div>
        <label class="block mb-bt-spacing-8 text-sm text-bt-primary-700">
          {{ $t("suppliers.fields.paymentTerms") }}
        </label>

        <input
          v-model="paymentTerms"
          type="text"
          class="w-full px-bt-spacing-16 py-bt-spacing-12 rounded-m border border-bt-grey-300 focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
        />
      </div>

      <!-- Currency -->

      <div>
        <label class="block mb-bt-spacing-8 text-sm text-bt-primary-700">
          {{ $t("suppliers.fields.mainCurrency") }}
        </label>

        <select
          v-model="mainCurrency"
          class="w-full px-bt-spacing-16 py-bt-spacing-12 rounded-m border border-bt-grey-300 focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
        >
          <option
            v-for="opt in currencyOptions"
            :key="opt.value"
            :value="opt.value"
          >
            {{ opt.label }}
          </option>
        </select>
      </div>

      <!-- Active -->

      <div class="md:col-span-2 flex items-center gap-bt-spacing-8">
        <input v-model="isActive" type="checkbox" />
        <span class="text-bt-primary-700">
          {{ $t("suppliers.fields.isActive") }}
        </span>
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
        :disabled="loading"
        class="px-bt-spacing-16 py-bt-spacing-12 rounded-m bg-bt-accent-500 text-bt-white hover:bg-bt-accent-600 disabled:bg-bt-disabled"
        @click="submit"
      >
        {{ loading ? $t("common.loading") : $t("common.save") }}
      </button>
    </div>
  </div>
</template>
