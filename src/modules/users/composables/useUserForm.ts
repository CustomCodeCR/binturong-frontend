import { ref, computed } from "vue";
import { UsersService } from "@/core/services/usersService";
import { useFormValidation } from "@/shared/composables/useFormValidation";
import { useToastStore } from "@/core/stores/toast";

import { required, email, minLength, arrayRequired } from "@/shared/validation/rules";

import type { User, UserCreateRequest, UserUpdateRequest } from "@/core/interfaces/users";

interface UserFormData {
  username: string
  email: string
  password: string
  confirmPassword: string
  roles: any[]
  isActive: boolean
  mustChangePassword: boolean
}

export function useUserForm() {

  const isSubmitting = ref(false)
  const toastStore = useToastStore()

  const {
    validate,
    getError,
    markAsTouched,
    clearErrors
  } = useFormValidation()

  const formData = ref<UserFormData>({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    roles: [],
    isActive: true,
    mustChangePassword: false
  })

  const passwordsMatch = computed(() => {
    return formData.value.password === formData.value.confirmPassword
  })

  // Schema de validación
  const validationSchema = {
    username: [
      required("Usuario"),
      minLength(4, "Usuario")
    ],
    email: [
      required("Email"),
      email()
    ],
    password: [
      required("Contraseña"),
      minLength(6, "Contraseña")
    ],
    roles: [
      arrayRequired("Roles")
    ]
  }
function validateForm(isEdit = false): boolean {

  const schema = isEdit
    ? {
        username: validationSchema.username,
        email: validationSchema.email,
        roles: validationSchema.roles
      }
    : validationSchema

  const valid = validate(formData.value, schema)

  if (!isEdit && !passwordsMatch.value) {
    return false
  }

  return valid
}

  async function createUser(): Promise<boolean> {

    if (!validateForm(false)) {
      toastStore.addToast({
        severity: "error",
        title: "Error de validación",
        message: "Por favor corrija los errores del formulario",
        duration: 3000
      })

      return false
    }

    isSubmitting.value = true

    try {

      const payload: UserCreateRequest = {
        username: formData.value.username,
        email: formData.value.email,
        password: formData.value.password,
        isActive: formData.value.isActive
      }

      const response = await UsersService.create(payload)

      // asignar roles en paralelo
      await Promise.all(
        formData.value.roles.map(role =>
          UsersService.modifyRole(response.userId, {
            roleId: role.roleId,
            replaceExisting: false
          })
        )
      )

      toastStore.addToast({
        severity: "success",
        title: "Usuario creado",
        message: "El usuario se creó correctamente",
        duration: 3000
      })

      return true

    } catch (err: any) {

      toastStore.addToast({
        severity: "error",
        title: "Error",
        message: err?.message || "No se pudo crear el usuario",
        duration: 3000
      })

      return false

    } finally {
      isSubmitting.value = false
    }
  }

  async function updateUser(id: string): Promise<boolean> {

    if (!validateForm(true)) {
      toastStore.addToast({
        severity: "error",
        title: "Error de validación",
        message: "Por favor corrija los errores del formulario",
        duration: 3000
      })

      return false
    }

    isSubmitting.value = true

    try {

      const payload: UserUpdateRequest = {
        username: formData.value.username,
        email: formData.value.email,
        isActive: formData.value.isActive,
        mustChangePassword: formData.value.mustChangePassword,
        lastLogin: null,
        failedAttempts: 0,
        lockedUntil: null
      }

      await UsersService.update(id, payload)

      toastStore.addToast({
        severity: "success",
        title: "Usuario actualizado",
        message: "El usuario se actualizó correctamente",
        duration: 3000
      })

      return true

    } catch (err: any) {

      toastStore.addToast({
        severity: "error",
        title: "Error",
        message: err?.message || "No se pudo actualizar el usuario",
        duration: 3000
      })

      return false

    } finally {
      isSubmitting.value = false
    }
  }

  function resetForm() {

    formData.value = {
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
      roles: [],
      isActive: true,
      mustChangePassword: false
    }

    clearErrors()
  }

  function loadUser(user: User) {

    formData.value = {
      username: user.username,
      email: user.email,
      password: "",
      confirmPassword: "",
      roles: user.roles || [],
      isActive: user.isActive,
      mustChangePassword: user.mustChangePassword
    }

    clearErrors()
  }

  return {
    formData,
    isSubmitting,
    passwordsMatch,
    validateForm,
    createUser,
    updateUser,
    resetForm,
    loadUser,
    getError,
    markAsTouched
  }
}