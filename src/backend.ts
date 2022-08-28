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
  timeout: number = 4000
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, r) => setTimeout(() => r(BackendTimeoutError), timeout)),
  ]);
}

export function setServerAPI(s: ServerAPI) {
  serverAPI = s;
}

export async function loadPage(appid: number, page: number): Promise<Page> {
  try {
    const res = await withTimeout(
      serverAPI!.callPluginMethod<{ appid: number; page: number }, Page>(
        "loadPage",
        { appid, page }
      )
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

export async function savePage(
  appid: number,
  page: number,
  data: string
): Promise<{ timestamp: number }> {
  try {
    const res = await withTimeout(
      serverAPI!.callPluginMethod<
        { appid: number; page: number; data: string },
        { timestamp: number }
      >("savePage", { appid, page, data })
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

export async function deletePage(
  appid: number,
  page: number
): Promise<boolean> {
  try {
    const res = await withTimeout(
      serverAPI!.callPluginMethod<{ appid: number; page: number }, boolean>(
        "deletePage",
        { appid, page }
      )
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

export async function saveLastSelectedPage(
  appid: number,
  page: number
): Promise<boolean> {
  try {
    const res = await withTimeout(
      serverAPI!.callPluginMethod<{ appid: number; page: number }, boolean>(
        "saveLastSelectedPage",
        { appid, page }
      )
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

export async function loadLastSelectedPage(appid: number): Promise<number> {
  try {
    const res = await withTimeout(
      serverAPI!.callPluginMethod<{ appid: number }, number>(
        "loadLastSelectedPage",
        { appid }
      )
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

export async function listPages(appid: number): Promise<Page[]> {
  try {
    const res = await withTimeout(
      serverAPI!.callPluginMethod<{ appid: number }, Page[]>("listPages", {
        appid,
      })
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
