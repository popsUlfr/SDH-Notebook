import { ServerAPI } from "decky-frontend-lib";

export interface Page {
  page: number;
  timestamp: number;
  empty: boolean;
  data?: string;
}

var serverAPI: ServerAPI | undefined = undefined;

const BackendTimeoutError = new Error("Backend call timed out");

function withTimeout<T>(
  promise: Promise<T>,
  timeout: number = 6000
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, r) => setTimeout(() => r(BackendTimeoutError), timeout)),
  ]);
}

export function setServerAPI(s: ServerAPI) {
  serverAPI = s;
}

async function backend_call<I, O>(name: string, params: I): Promise<O> {
  try {
    const res = await withTimeout(
      serverAPI!.callPluginMethod<I, O>(name, params)
    );
    if (res.success) return res.result;
    else {
      console.error(res.result);
      throw res.result;
    }
  } catch (e) {
    console.error(e);
    throw e;
  }
}

export async function loadPage(appid: number, page: number): Promise<Page> {
  return backend_call<{ appid: number; page: number }, Page>("loadPage", {
    appid,
    page,
  });
}

export async function savePage(
  appid: number,
  page: number,
  data: string
): Promise<{ timestamp: number }> {
  return backend_call<
    { appid: number; page: number; data: string },
    { timestamp: number }
  >("savePage", { appid, page, data });
}

export async function deletePage(
  appid: number,
  page: number
): Promise<boolean> {
  return backend_call<{ appid: number; page: number }, boolean>("deletePage", {
    appid,
    page,
  });
}

export async function saveLastSelectedPage(
  appid: number,
  page: number
): Promise<boolean> {
  return backend_call<{ appid: number; page: number }, boolean>(
    "saveLastSelectedPage",
    { appid, page }
  );
}

export async function loadLastSelectedPage(appid: number): Promise<number> {
  return backend_call<{ appid: number }, number>("loadLastSelectedPage", {
    appid,
  });
}

export async function listPages(appid: number): Promise<Page[]> {
  return backend_call<{ appid: number }, Page[]>("listPages", { appid });
}
