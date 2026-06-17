// swap this for your real ePm middleware URL (or set VITE_API_BASE in .env)
export const API_BASE =
  import.meta.env?.VITE_API_BASE ?? "";

// credentials the ePm API expects to issue a Bearer token
export const API_CREDENTIALS = {
  UserName: "epmapidev",
  Password: "epm#003",
  Role: "api",
};

export const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;
