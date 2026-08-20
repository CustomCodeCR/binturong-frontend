<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useI18n } from "vue-i18n";

import { useModalStore } from "@/core/stores/modalStore";
import { ClientsService } from "@/core/services/clientsService";
import { useValidation } from "@/shared/composables/useValidation";
import BTFieldError from "@/shared/components/ui/BTFieldError.vue";
import { buildClientSchema } from "@/modules/clients/clientFormSchema";

import type { Client } from "@/core/interfaces/clients";

const props = defineProps<{
  clientId: string;
}>();

const { t } = useI18n();
const modalStore = useModalStore();
const { rules, validate, getError, fieldClass, firstError } = useValidation();

const personTypeLabels: Record<string, string> = {
  Juridico: "Jurídico",
  Fisico: "Físico",
};

const identificationTypeLabels: Record<string, string> = {
  CedulaJuridica: "Cédula jurídica",
  CedulaNacional: "Cédula nacional",
  CedulaResidencia: "Cédula de residencia",
  Pasaporte: "Pasaporte",
};

const loading = ref(false);
const saving = ref(false);

const client = ref<Client | null>(null);

const personType = ref("Juridico");
const identificationType = ref("CedulaJuridica");
const identification = ref("");
const tradeName = ref("");
const contactName = ref("");
const email = ref("");
const primaryPhone = ref("");
const secondaryPhone = ref("");
const industry = ref("");
const clientType = ref("");
const score = ref<number | null>(0);
const isActive = ref(true);

const personTypeLabel = computed(
  () => personTypeLabels[personType.value] ?? personType.value,
);

const identificationTypeLabel = computed(
  () =>
    identificationTypeLabels[identificationType.value] ??
    identificationType.value,
);

function closeModal() {
  modalStore.close();
}

async function loadClient() {
  loading.value = true;

  try {
    const response = await ClientsService.readById(props.clientId);
    client.value = response;

    // Los campos opcionales llegan como `null` desde la API. Asignarlos tal
    // cual hacía que `.trim()` reventara al guardar y ninguna edición se
    // llegara a enviar.
    const text = (value?: string | null) => value ?? "";

    personType.value = response.personType;
    identificationType.value = response.identificationType;
    identification.value = text(response.identification);
    tradeName.value = text(response.tradeName);
    contactName.value = text(response.contactName);
    email.value = text(response.email);
    primaryPhone.value = text(response.primaryPhone);
    secondaryPhone.value = text(response.secondaryPhone);
    industry.value = text(response.industry);
    clientType.value = text(response.clientType);
    score.value = response.score ?? 0;
    isActive.value = response.isActive;
  } finally {
    loading.value = false;
  }
}

function validateForm(): boolean {
  // La identificación sí es editable: el backend la acepta en el update y la
  // valida contra el tipo de identificación del cliente.
  const schema = buildClientSchema(rules, t, identificationType.value);

  return validate(
    {
      identification: identification.value,
      tradeName: tradeName.value,
      contactName: contactName.value,
      email: email.value,
      primaryPhone: primaryPhone.value,
      secondaryPhone: secondaryPhone.value,
      industry: industry.value,
      clientType: clientType.value,
      score: score.value,
    },
    schema,
  );
}

async function submit() {
  if (!validateForm()) {
    modalStore.onError?.({ code: 400, message: firstError.value });
    return;
  }

  saving.value = true;

  try {
    // `personType` e `identificationType` no forman parte de
    // ClientUpdateRequest y el backend los mantiene fijos; `identification` sí
    // se envía y se persiste.
    await ClientsService.update(props.clientId, {
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

    // La vista usa este payload para pintar la fila al instante y reintentar la
    // carga hasta que la proyección de lectura se ponga al día. Con solo
    // `{ ok: true }` recargaba de inmediato y mostraba el dato viejo.
    modalStore.onSuccess?.({
      clientId: props.clientId,
      identification: identification.value.trim(),
      identificationType: identificationType.value,
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
    modalStore.close();
  } catch (error: any) {
    modalStore.onError?.({
      code: error?.status ?? 500,
      message: error?.message ?? t("clients.messages.updateError"),
    });
  } finally {
    saving.value = false;
  }
}

onMounted(async () => {
  await loadClient();
});
</script>

<template>
  <div
    class="bg-bt-white rounded-l shadow-bt-elevation-400 w-full max-w-4xl p-bt-spacing-24"
  >
    <div class="mb-bt-spacing-24">
      <h2 class="text-xl font-bt-bold text-bt-primary-700">
        {{ $t("clients.modal.editTitle") }}
      </h2>
      <p class="text-bt-grey-600 mt-bt-spacing-8">
        {{ $t("clients.modal.editDescription") }}
      </p>
    </div>

    <div v-if="loading" class="py-bt-spacing-24 text-center text-bt-grey-500">
      {{ $t("common.loading") }}
    </div>

    <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-bt-spacing-16">
      <!--
        La identificación es la clave de negocio del cliente: el backend la
        conserva y no la incluye en el comando de actualización. Se muestra en
        solo lectura para que el usuario sepa por qué no puede editarla.
      -->
      <div>
        <label class="block mb-bt-spacing-8 text-sm text-bt-primary-700">
          {{ $t("clients.fields.personType") }}
        </label>
        <input
          :value="personTypeLabel"
          type="text"
          disabled
          class="w-full px-bt-spacing-16 py-bt-spacing-12 rounded-m border border-bt-grey-300 bg-bt-grey-100 text-bt-grey-600 cursor-not-allowed focus:outline-none"
        />
      </div>

      <div>
        <label class="block mb-bt-spacing-8 text-sm text-bt-primary-700">
          {{ $t("clients.fields.identificationType") }}
        </label>
        <input
          :value="identificationTypeLabel"
          type="text"
          disabled
          class="w-full px-bt-spacing-16 py-bt-spacing-12 rounded-m border border-bt-grey-300 bg-bt-grey-100 text-bt-grey-600 cursor-not-allowed focus:outline-none"
        />
      </div>

      <div class="md:col-span-2">
        <label class="block mb-bt-spacing-8 text-sm text-bt-primary-700">
          {{ $t("clients.fields.identification") }}
        </label>
        <input
          v-model="identification"
          type="text"
          class="w-full px-bt-spacing-16 py-bt-spacing-12 rounded-m border focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
          :class="fieldClass('identification')"
        />
        <BTFieldError :message="getError('identification')" />
      </div>

      <div>
        <label class="block mb-bt-spacing-8 text-sm text-bt-primary-700">
          {{ $t("clients.fields.tradeName") }}
        </label>
        <input
          v-model="tradeName"
          type="text"
          class="w-full px-bt-spacing-16 py-bt-spacing-12 rounded-m border focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
          :class="fieldClass('tradeName')"
        />
        <BTFieldError :message="getError('tradeName')" />
      </div>

      <div>
        <label class="block mb-bt-spacing-8 text-sm text-bt-primary-700">
          {{ $t("clients.fields.contactName") }}
        </label>
        <input
          v-model="contactName"
          type="text"
          class="w-full px-bt-spacing-16 py-bt-spacing-12 rounded-m border focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
          :class="fieldClass('contactName')"
        />
        <BTFieldError :message="getError('contactName')" />
      </div>

      <div>
        <label class="block mb-bt-spacing-8 text-sm text-bt-primary-700">
          {{ $t("clients.fields.email") }}
        </label>
        <input
          v-model="email"
          type="email"
          class="w-full px-bt-spacing-16 py-bt-spacing-12 rounded-m border focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
          :class="fieldClass('email')"
        />
        <BTFieldError :message="getError('email')" />
      </div>

      <div>
        <label class="block mb-bt-spacing-8 text-sm text-bt-primary-700">
          {{ $t("clients.fields.primaryPhone") }}
        </label>
        <input
          v-model="primaryPhone"
          type="text"
          class="w-full px-bt-spacing-16 py-bt-spacing-12 rounded-m border focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
          :class="fieldClass('primaryPhone')"
        />
        <BTFieldError :message="getError('primaryPhone')" />
      </div>

      <div>
        <label class="block mb-bt-spacing-8 text-sm text-bt-primary-700">
          {{ $t("clients.fields.secondaryPhone") }}
        </label>
        <input
          v-model="secondaryPhone"
          type="text"
          class="w-full px-bt-spacing-16 py-bt-spacing-12 rounded-m border focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
          :class="fieldClass('secondaryPhone')"
        />
        <BTFieldError :message="getError('secondaryPhone')" />
      </div>

      <div>
        <label class="block mb-bt-spacing-8 text-sm text-bt-primary-700">
          {{ $t("clients.fields.industry") }}
        </label>
        <input
          v-model="industry"
          type="text"
          class="w-full px-bt-spacing-16 py-bt-spacing-12 rounded-m border focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
          :class="fieldClass('industry')"
        />
        <BTFieldError :message="getError('industry')" />
      </div>

      <div>
        <label class="block mb-bt-spacing-8 text-sm text-bt-primary-700">
          {{ $t("clients.fields.clientType") }}
        </label>
        <input
          v-model="clientType"
          type="text"
          class="w-full px-bt-spacing-16 py-bt-spacing-12 rounded-m border focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
          :class="fieldClass('clientType')"
        />
        <BTFieldError :message="getError('clientType')" />
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
          class="w-full px-bt-spacing-16 py-bt-spacing-12 rounded-m border focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
          :class="fieldClass('score')"
        />
        <BTFieldError :message="getError('score')" />
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
        :disabled="saving"
        class="px-bt-spacing-16 py-bt-spacing-12 rounded-m bg-bt-accent-500 text-bt-white hover:bg-bt-accent-600 disabled:bg-bt-disabled"
        @click="submit"
      >
        {{ saving ? $t("common.loading") : $t("clients.actions.saveChanges") }}
      </button>
    </div>
  </div>
</template>
