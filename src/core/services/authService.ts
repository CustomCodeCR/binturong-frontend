import { Endpoints } from "@/core/composables/endpoints";
import { callEndpoint } from "@/core/api/callEndpoint";
import type { LoginRequest, LoginResponse } from "@/core/interfaces/auth";

export const AuthService = {
  async login(payload: LoginRequest): Promise<LoginResponse> {
    return await callEndpoint<LoginResponse, LoginRequest>(Endpoints.login, {
      body: payload,
    });
  },
};
