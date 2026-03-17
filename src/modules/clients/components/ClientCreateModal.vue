<script setup lang="ts">
import { ref, watch } from "vue";
import { useI18n } from "vue-i18n";

import { useModalStore } from "@/core/stores/modalStore";
import { ClientsService } from "@/core/services/clientsService";

const { t } = useI18n();
const modalStore = useModalStore();

const personTypeOptions = [
  { value: "Juridico", label: "Jurídico" },
  { value: "Fisico", label: "Físico" },
];

const identificationTypeOptionsForPhysical = [
  { value: "CedulaNacional", label: "Cédula nacional" },
  { value: "CedulaResidencia", label: "Cédula de residencia" },
  { value: "Pasaporte", label: "Pasaporte" },
];

const personType = ref("Juridico");
const identificationType = ref("CedulaJuridica");
const identification = ref("");
const tradeName = ref("");
const contactName = ref("");
const email = ref("");
const primaryPhone = ref("");
const secondaryPhone = ref("");
const industry = ref("");
const clientType = ref("Regular");
const score = ref<number | null>(0);
const isActive = ref(true);

const loading = ref(false);

watch(
  personType,
  (value) => {
    if (value === "Juridico") {
      identificationType.value = "CedulaJuridica";
      return;
    }

    if (
      !["CedulaNacional", "CedulaResidencia", "Pasaporte"].includes(
        identificationType.value,
      )
    ) {
      identificationType.value = "CedulaNacional";
    }
  },
  { immediate: true },
);

function closeModal() {
  modalStore.close();
}

async function submit() {
  if (
    !personType.value.trim() ||
    !identificationType.value.trim() ||
    !identification.value.trim() ||
    !tradeName.value.trim() ||
    !contactName.value.trim() ||
    !email.value.trim() ||
    !primaryPhone.value.trim()
  ) {
    modalStore.onError?.({
      code: 400,
      message: t("clients.validation.requiredCreate"),
    });
    return;
  }

  loading.value = true;

  try {
    const created = await ClientsService.create({
      personType: personType.value.trim(),
      identificationType: identificationType.value.trim(),
      identification: identification.value.trim(),
      tradeName: tradeName.value.trim(),
      contactName: contactName.value.trim(),
      email: email.value.trim(),
      primaryPhone: primaryPhone.value.trim(),
      secondaryPhone: secondaryPhone.value.trim(),
      industry: industry.value.trim(),
      clientType: clientType.value.trim(),
      score: Number(score.value ?? 0),
      isActive: isActive.value,
    });

    modalStore.onSuccess?.(created);
    modalStore.close();
  } catch (error: any) {
    modalStore.onError?.({
      code: error?.status ?? 500,
      message: error?.message ?? t("clients.messages.createError"),
    });
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div
    class="bg-bt-white rounded-l shadow-bt-elevation-400 w-full max-w-5xl p-bt-spacing-24"
  >
    <div class="mb-bt-spacing-24">
      <h2 class="text-xl font-bt-bold text-bt-primary-700">
        {{ $t("clients.modal.createTitle") }}
      </h2>
      <p class="text-bt-grey-600 mt-bt-spacing-8">
        {{ $t("clients.modal.createDescription") }}
      </p>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-bt-spacing-16">
      <div>
        <label class="block mb-bt-spacing-8 text-sm text-bt-primary-700">
          {{ $t("clients.fields.personType") }}
        </label>
        <select
          v-model="personType"
          class="w-full px-bt-spacing-16 py-bt-spacing-12 rounded-m border border-bt-grey-300 bg-bt-white focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
        >
          <option
            v-for="option in personTypeOptions"
            :key="option.value"
            :value="option.value"
          >
            {{ option.label }}
          </option>
        </select>
      </div>

      <div>
        <label class="block mb-bt-spacing-8 text-sm text-bt-primary-700">
          {{ $t("clients.fields.identificationType") }}
        </label>

        <input
          v-if="personType === 'Juridico'"
          :value="'CedulaJuridica'"
          type="text"
          disabled
          class="w-full px-bt-spacing-16 py-bt-spacing-12 rounded-m border border-bt-grey-300 bg-bt-grey-100 text-bt-grey-600 cursor-not-allowed focus:outline-none"
        />

        <select
          v-else
          v-model="identificationType"
          class="w-full px-bt-spacing-16 py-bt-spacing-12 rounded-m border border-bt-grey-300 bg-bt-white focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
        >
          <option
            v-for="option in identificationTypeOptionsForPhysical"
            :key="option.value"
            :value="option.value"
          >
            {{ option.label }}
          </option>
        </select>
      </div>

      <div>
        <label class="block mb-bt-spacing-8 text-sm text-bt-primary-700">
          {{ $t("clients.fields.identification") }}
        </label>
        <input
          v-model="identification"
          type="text"
          class="w-full px-bt-spacing-16 py-bt-spacing-12 rounded-m border border-bt-grey-300 focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
        />
      </div>

      <div>
        <label class="block mb-bt-spacing-8 text-sm text-bt-primary-700">
          {{ $t("clients.fields.tradeName") }}
        </label>
        <input
          v-model="tradeName"
          type="text"
          class="w-full px-bt-spacing-16 py-bt-spacing-12 rounded-m border border-bt-grey-300 focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
        />
      </div>

      <div>
        <label class="block mb-bt-spacing-8 text-sm text-bt-primary-700">
          {{ $t("clients.fields.contactName") }}
        </label>
        <input
          v-model="contactName"
          type="text"
          class="w-full px-bt-spacing-16 py-bt-spacing-12 rounded-m border border-bt-grey-300 focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
        />
      </div>

      <div>
        <label class="block mb-bt-spacing-8 text-sm text-bt-primary-700">
          {{ $t("clients.fields.email") }}
        </label>
        <input
          v-model="email"
          type="email"
          class="w-full px-bt-spacing-16 py-bt-spacing-12 rounded-m border border-bt-grey-300 focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
        />
      </div>

      <div>
        <label class="block mb-bt-spacing-8 text-sm text-bt-primary-700">
          {{ $t("clients.fields.primaryPhone") }}
        </label>
        <input
          v-model="primaryPhone"
          type="text"
          class="w-full px-bt-spacing-16 py-bt-spacing-12 rounded-m border border-bt-grey-300 focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
        />
      </div>

      <div>
        <label class="block mb-bt-spacing-8 text-sm text-bt-primary-700">
          {{ $t("clients.fields.secondaryPhone") }}
        </label>
        <input
          v-model="secondaryPhone"
          type="text"
          class="w-full px-bt-spacing-16 py-bt-spacing-12 rounded-m border border-bt-grey-300 focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
        />
      </div>

      <div>
        <label class="block mb-bt-spacing-8 text-sm text-bt-primary-700">
          {{ $t("clients.fields.industry") }}
        </label>
        <input
          v-model="industry"
          type="text"
          class="w-full px-bt-spacing-16 py-bt-spacing-12 rounded-m border border-bt-grey-300 focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
        />
      </div>

      <div>
        <label class="block mb-bt-spacing-8 text-sm text-bt-primary-700">
          {{ $t("clients.fields.clientType") }}
        </label>
        <input
          v-model="clientType"
          type="text"
          class="w-full px-bt-spacing-16 py-bt-spacing-12 rounded-m border border-bt-grey-300 focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
        />
      </div>

      <div>
        <label class="block mb-bt-spacing-8 text-sm text-bt-primary-700">
          {{ $t("clients.fields.score") }}
        </label>
        <input
          v-model.number="score"
          type="number"
          min="0"
          max="100"
          step="1"
          class="w-full px-bt-spacing-16 py-bt-spacing-12 rounded-m border border-bt-grey-300 focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
        />
      </div>

      <div class="flex items-center gap-bt-spacing-8 pt-bt-spacing-32">
        <input v-model="isActive" type="checkbox" />
        <span class="text-bt-primary-700">
          {{ $t("clients.fields.isActive") }}
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
