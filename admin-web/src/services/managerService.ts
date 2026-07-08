// @ts-nocheck
import api from "./api";

export const getManagers = () => api.get("/auth/managers");

export const createManager = (data) => api.post("/auth/managers", data);

