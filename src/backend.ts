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

export async function serverPageUrl(): Promise<string> {
  //console.log(new Date().toLocaleString(), "serverPageUrl", arguments);
  try {
    const res = await withTimeout(
      serverAPI!.callPluginMethod<{}, string>("serverPageUrl", {})
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
  //console.log(new Date().toLocaleString(), "loadPage", arguments);
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

export async function loadPageServer(
  appid: number,
  page: number
): Promise<Page> {
  //console.log(new Date().toLocaleString(), "loadPageServer", arguments);
  try {
    const url = await serverPageUrl();
    //console.log(new Date().toLocaleString(), "loadPageServer", "url", url);
    const res = await withTimeout(
      fetch(
        url +
          "?" +
          new URLSearchParams({
            appid: String(appid),
            page: String(page),
          }).toString(),
        { method: "GET" }
      )
    );
    if (!res.ok) {
      throw new Error(res.status + " " + res.statusText);
    }
    return (await res.json()) as Page;
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
  //console.log(new Date().toLocaleString(), "savePage", arguments);
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

export async function savePageServer(
  appid: number,
  page: number,
  data: string
): Promise<{ timestamp: number }> {
  //console.log(new Date().toLocaleString(), "savePageServer", arguments);
  try {
    const url = await serverPageUrl();
    //console.log(new Date().toLocaleString(), "savePageServer", "url", url);
    const res = await withTimeout(
      fetch(url, {
        method: "POST",
        body: JSON.stringify({ appid, page, data }),
      })
    );
    if (!res.ok) {
      throw new Error(res.status + " " + res.statusText);
    }
    return await res.json();
  } catch (e) {
    console.error(e);
    throw e;
  }
}

export async function deletePage(
  appid: number,
  page: number
): Promise<boolean> {
  //console.log(new Date().toLocaleString(), "deletePage", arguments);
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
  //console.log(new Date().toLocaleString(), "saveLastSelectedPage", arguments);
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
  //console.log(new Date().toLocaleString(), "loadLastSelectedPage", arguments);
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
  //console.log(new Date().toLocaleString(), "listPages", arguments);
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
