<script setup lang="ts">
import { ref } from "vue";
import { useI18n } from "vue-i18n";

import { useModalStore } from "@/core/stores/modalStore";
import { ClientsService } from "@/core/services/clientsService";

import type { ClientContact } from "@/core/interfaces/clients";

const props = defineProps<{
  clientId: string;
  contact?: ClientContact | null;
}>();

const { t } = useI18n();
const modalStore = useModalStore();

const loading = ref(false);

const name = ref(props.contact?.name ?? "");
const jobTitle = ref(props.contact?.jobTitle ?? "");
const email = ref(props.contact?.email ?? "");
const phone = ref(props.contact?.phone ?? "");
const isPrimary = ref(props.contact?.isPrimary ?? false);

const isEdit = !!props.contact?.contactId;

function closeModal() {
  modalStore.close();
}

async function submit() {
  if (
    !name.value.trim() ||
    !jobTitle.value.trim() ||
    !email.value.trim() ||
    !phone.value.trim()
  ) {
    modalStore.onError?.({
      code: 400,
      message: t("clients.contacts.validation.required"),
    });
    return;
  }

  loading.value = true;

  try {
    if (isEdit && props.contact?.contactId) {
      await ClientsService.updateContact(
        props.clientId,
        props.contact.contactId,
        {
          name: name.value.trim(),
          jobTitle: jobTitle.value.trim(),
          email: email.value.trim(),
          phone: phone.value.trim(),
          isPrimary: isPrimary.value,
        },
      );
    } else {
      await ClientsService.addContact(props.clientId, {
        name: name.value.trim(),
        jobTitle: jobTitle.value.trim(),
        email: email.value.trim(),
        phone: phone.value.trim(),
        isPrimary: isPrimary.value,
      });
    }

    modalStore.onSuccess?.({ ok: true });
    modalStore.close();
  } catch (error: any) {
    modalStore.onError?.({
      code: error?.status ?? 500,
      message:
        error?.message ??
        (isEdit
          ? t("clients.contacts.messages.updateError")
          : t("clients.contacts.messages.createError")),
    });
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div
    class="bg-bt-white rounded-l shadow-bt-elevation-400 w-full max-w-2xl p-bt-spacing-24"
  >
    <div class="mb-bt-spacing-24">
      <h2 class="text-xl font-bt-bold text-bt-primary-700">
        {{
          isEdit
            ? $t("clients.contacts.modal.editTitle")
            : $t("clients.contacts.modal.createTitle")
        }}
      </h2>
      <p class="text-bt-grey-600 mt-bt-spacing-8">
        {{
          isEdit
            ? $t("clients.contacts.modal.editDescription")
            : $t("clients.contacts.modal.createDescription")
        }}
      </p>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-bt-spacing-16">
      <div>
        <label class="block mb-bt-spacing-8 text-sm text-bt-primary-700">{{
          $t("clients.contacts.fields.name")
        }}</label>
        <input
          v-model="name"
          type="text"
          class="w-full px-bt-spacing-16 py-bt-spacing-12 rounded-m border border-bt-grey-300 focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
        />
      </div>

      <div>
        <label class="block mb-bt-spacing-8 text-sm text-bt-primary-700">{{
          $t("clients.contacts.fields.jobTitle")
        }}</label>
        <input
          v-model="jobTitle"
          type="text"
          class="w-full px-bt-spacing-16 py-bt-spacing-12 rounded-m border border-bt-grey-300 focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
        />
      </div>

      <div>
        <label class="block mb-bt-spacing-8 text-sm text-bt-primary-700">{{
          $t("clients.contacts.fields.email")
        }}</label>
        <input
          v-model="email"
          type="email"
          class="w-full px-bt-spacing-16 py-bt-spacing-12 rounded-m border border-bt-grey-300 focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
        />
      </div>

      <div>
        <label class="block mb-bt-spacing-8 text-sm text-bt-primary-700">{{
          $t("clients.contacts.fields.phone")
        }}</label>
        <input
          v-model="phone"
          type="text"
          class="w-full px-bt-spacing-16 py-bt-spacing-12 rounded-m border border-bt-grey-300 focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
        />
      </div>

      <div class="md:col-span-2 flex items-center gap-bt-spacing-8">
        <input v-model="isPrimary" type="checkbox" />
        <span class="text-bt-primary-700">{{
          $t("clients.contacts.fields.isPrimary")
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
        :disabled="loading"
        class="px-bt-spacing-16 py-bt-spacing-12 rounded-m bg-bt-accent-500 text-bt-white hover:bg-bt-accent-600 disabled:bg-bt-disabled"
        @click="submit"
      >
        {{ loading ? $t("common.loading") : $t("common.save") }}
      </button>
    </div>
  </div>
</template>

