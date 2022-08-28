import { ServerAPI } from "decky-frontend-lib";

export interface Page {
    page: number;
    timestamp: number;
    empty: boolean;
    data?: string;
}

var serverAPI: ServerAPI | undefined = undefined;

export function setServerAPI(s: ServerAPI) {
    serverAPI = s;
}

export async function loadPage(appid: number, page: number): Promise<Page> {
    const res = await serverAPI!.callPluginMethod<{appid: number, page: number}, Page>("loadPage", {appid, page});
    if (res.success) return res.result;
    else console.error(res.result);
    return {page: 0, timestamp: 0, empty: true};
}

export async function savePage(appid: number, page: number, data: string): Promise<{timestamp: number}> {
    const res = await serverAPI!.callPluginMethod<{appid: number, page: number, data: string}, {timestamp: number}>("savePage", {appid, page, data});
    if (res.success) return res.result;
    else console.error(res.result);
    return {timestamp: 0};
}

export async function deletePage(appid: number, page: number): Promise<boolean> {
    const res = await serverAPI!.callPluginMethod<{appid: number, page: number}, boolean>("deletePage", {appid, page});
    if (res.success) return res.result;
    else console.error(res.result);
    return false;
}

export async function saveLastSelectedPage(appid: number, page: number): Promise<boolean> {
    const res = await serverAPI!.callPluginMethod<{appid: number, page: number}, boolean>("saveLastSelectedPage", {appid, page});
    if (res.success) return res.result;
    else console.error(res.result);
    return false;
}

export async function loadLastSelectedPage(appid: number): Promise<number> {
    const res = await serverAPI!.callPluginMethod<{appid: number}, number>("loadLastSelectedPage", {appid});
    if (res.success) return res.result;
    else console.error(res.result);
    return 0;
}

export async function listPages(appid: number): Promise<Page[]> {
    const res = await serverAPI!.callPluginMethod<{appid: number}, Page[]>("listPages", {appid});
    if (res.success) return res.result;
    else console.error(res.result);
    return [];
}