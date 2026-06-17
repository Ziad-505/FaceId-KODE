import { API_BASE, API_CREDENTIALS } from "../config/constants";

// thrown specifically on 401 so the UI can auto-logout the user
export class SessionExpiredError extends Error {
  constructor(detail = "") {
    super(detail ? `Session expired: ${detail}` : "Session expired — please sign in again");
    this.name = "SessionExpiredError";
  }
}

// tries to parse JSON; returns null instead of throwing if it can't
async function safeJson(response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

// reads the error body and throws a useful message (or SessionExpiredError on 401)
async function handleHttpError(response) {
  const status = response.status;
  const body = await safeJson(response);
  const detail = body?.errorMessage || body?.error || body?.message || "";

  if (status === 401) throw new SessionExpiredError(detail);
  throw new Error(detail || `API returned HTTP ${status}`);
}

// get a Bearer token from the ePm login endpoint
export async function loginToApi() {
  const response = await fetch(`${API_BASE}/api/Login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(API_CREDENTIALS),
  });

  if (!response.ok) await handleHttpError(response);

  const data = await safeJson(response);
  if (!data) throw new Error("Invalid response from server (not JSON)");

  if (!data.token || typeof data.token !== "string") {
    throw new Error("No token in response");
  }

  return { token: data.token };
}

// look up a member by their personnel code and return their AEOS carrier ID + name
export async function findOwner(personnelNo, token) {
  const response = await fetch(`${API_BASE}/api/owner/find`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ PersonnelNo: personnelNo.trim() }),
  });

  if (!response.ok) await handleHttpError(response);

  const data = await safeJson(response);
  if (!data) throw new Error("Invalid response from server (not JSON)");
  if (data.errorMessage) throw new Error(data.errorMessage);

  // the response wraps AEOS data inside a SOAP envelope
  const envelope = data?.data?.["soap:Envelope"]?.["soap:Body"];
  const employees = envelope?.EmployeeList?.Employee;
  if (!employees) throw new Error("Member not found in AEOS");

  // Employee can be a single object or an array (partial match returns many)
  const list = Array.isArray(employees) ? employees : [employees];
  const code = personnelNo.trim();

  // find the exact PersonnelNo match first, fall back to first result
  const match =
    list.find((e) => e.EmployeeInfo?.PersonnelNo === code) ?? list[0];
  const info = match?.EmployeeInfo;
  if (!info?.Id) throw new Error("Member not found in AEOS");

  return {
    id: info.Id,
    firstName: info.FirstName ?? "",
    lastName: info.LastName ?? "",
  };
}

// send a base64 face image for a carrier — this enrolls them in AEOS + Suprema
export async function addOwnerImage(carrierId, imageBase64, token) {
  const response = await fetch(`${API_BASE}/api/owner/addimage`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ Id: Number(carrierId), Image: imageBase64 }),
  });

  if (!response.ok) await handleHttpError(response);

  const data = await safeJson(response);
  if (!data) throw new Error("Invalid response from server (not JSON)");

  if (data.supremaStatus !== true) {
    throw new Error(data.error || "Upload rejected by AEOS/Suprema");
  }
}
