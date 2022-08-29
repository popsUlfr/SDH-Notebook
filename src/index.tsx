import {
  definePlugin,
  PanelSection,
  ServerAPI,
  staticClasses,
  Button,
  Router,
  Dropdown,
  PanelSectionRow,
  SingleDropdownOption,
  AppOverview,
  DropdownOption,
} from "decky-frontend-lib";
import { VFC, useState, useEffect } from "react";
import { FaBookOpen, FaPenFancy, FaEraser, FaTrash } from "react-icons/fa";
import {
  ReactSketchCanvas,
  ReactSketchCanvasRef,
  CanvasPath,
} from "react-sketch-canvas";
import TimeAgo from "react-timeago";
import { debounce, throttle, wrap } from "lodash";

import * as config from "./config";
import * as backend from "./backend";
import background from "../assets/background.svg";

interface FocusChangeEventObject {
  focusedApp: {
    appid: number;
    pid: number;
    strExeName: string;
    windowid: number;
  };
}
declare var SteamClient: {
  System: {
    UI: {
      // careful it's firing a lot in intervals, should be throttled
      RegisterForFocusChangeEvents: (
        cb: (fce: FocusChangeEventObject) => void
      ) => { unregister: () => void };
    };
  };
};

const PageLabel: VFC<{ page: number; timestamp: number }> = ({
  page,
  timestamp,
}) => {
  const [pPage, pPageSet] = useState<number>(page);
  const [pTimestamp, pTimestampSet] = useState<number>(timestamp);

  useEffect(() => {
    pPageSet(page);
    pTimestampSet(timestamp);
  }, [page, timestamp]);

  return (
    <div>
      Page {pPage} -{" "}
      {pTimestamp ? (
        <TimeAgo
          date={pTimestamp}
          formatter={(value, unit, suffix) => {
            if (suffix === "from now") {
              return "0s ago";
            }
            if (unit === "month") {
              return value + "mo ago";
            }
            return value + unit[0] + " ago";
          }}
        />
      ) : (
        "Empty"
      )}
    </div>
  );
};

const Content: VFC<{ serverAPI: ServerAPI }> = ({ serverAPI }) => {
  let sketchCanvasRef: ReactSketchCanvasRef | undefined;

  const [runningApp, setRunningApp] = useState<AppOverview | undefined>(
    Router.MainRunningApp
  );
  const [eraserMode, setEraserMode] = useState<boolean>(false);
  const [selectedPage, setSelectedPage] = useState<number>(0);
  const [deleteState, setDeleteState] = useState<boolean>(false);
  const [disableState, setDisableState] = useState<boolean>(true);
  const [pages, setPages] = useState<DropdownOption[]>(
    Array.from({ length: config.MaxPages }, (_, i) => ({
      label: <PageLabel page={i} timestamp={0} />,
      data: i,
    }))
  );

  const toastError = (e: any) => {
    serverAPI.toaster.toast({
      title: "Notebook Error",
      body: String(e),
      critical: true,
      duration: 30000,
      icon: <FaBookOpen />,
    });
  };

  const loadPage = async (
    appid: number,
    page: number
  ): Promise<CanvasPath[]> => {
    let p: backend.Page;
    try {
      p = await backend.loadPage(appid, page);
    } catch (e) {
      toastError(e);
      return [];
    }
    if (p.empty || !p.data?.length) return [];
    try {
      return JSON.parse(p.data) as CanvasPath[];
    } catch (e) {
      console.error(e);
      toastError(e);
    }
    return [];
  };

  const savePage = async (
    appid: number,
    page: number,
    data: CanvasPath[]
  ): Promise<number> => {
    const jsonData = data.length > 0 ? JSON.stringify(data) : "";
    try {
      return (await backend.savePage(appid, page, jsonData)).timestamp;
    } catch (e) {
      toastError(e);
      return 0;
    }
  };

  const deletePage = async (appid: number, page: number): Promise<boolean> => {
    try {
      return await backend.deletePage(appid, page);
    } catch (e) {
      toastError(e);
      return false;
    }
  };

  const saveLastSelectedPage = async (
    appid: number,
    page: number
  ): Promise<boolean> => {
    try {
      return await backend.saveLastSelectedPage(appid, page);
    } catch (e) {
      toastError(e);
      return false;
    }
  };

  const loadLastSelectedPage = async (appid: number): Promise<number> => {
    try {
      return await backend.loadLastSelectedPage(appid);
    } catch (e) {
      toastError(e);
      return 0;
    }
  };

  const listPages = async (appid: number): Promise<backend.Page[]> => {
    try {
      return await backend.listPages(appid);
    } catch (e) {
      toastError(e);
      return [];
    }
  };

  const refresh = debounce(
    wrap(
      async () => {
        setRunningApp(Router.MainRunningApp);
        const appid = Number(Router.MainRunningApp?.appid || 0);
        const bPages = await listPages(appid);
        const lastSelectedPage = await loadLastSelectedPage(appid);
        const oPages = [...pages];
        oPages.forEach((o) => {
          const p = bPages.find((p) => p.page === o.data);
          o.label = (
            <PageLabel
              page={o.data}
              timestamp={!p?.empty && p?.timestamp ? p.timestamp : 0}
            />
          );
        });
        // the pages are sorted by descending modification time and then by ascending page index
        oPages.sort((a, b) => {
          const pA = bPages.find((p) => p.page === a.data);
          const pB = bPages.find((p) => p.page === b.data);
          const v = (pB?.timestamp || 0) - (pA?.timestamp || 0);
          if (v === 0) {
            return a.data - b.data;
          }
          return v;
        });
        setPages(oPages);
        setSelectedPage(lastSelectedPage);
        sketchCanvasRef?.resetCanvas();
        const canvasPaths = await loadPage(appid, lastSelectedPage);
        sketchCanvasRef?.loadPaths(canvasPaths);
      },
      (f) => {
        // wrap with disabled state
        setDisableState(true);
        return f().finally(() => setDisableState(false));
      }
    ),
    config.RefreshWait
  );

  // called when the ref is ready
  const sketchCanvasRefCallback = async (ref: ReactSketchCanvasRef) => {
    if (!ref) return;
    sketchCanvasRef = ref;
    sketchCanvasRef.eraseMode(eraserMode);
  };

  useEffect(() => {
    let runningAppPid: number = 0;
    const { unregister } = SteamClient.System.UI.RegisterForFocusChangeEvents(
      throttle(async (fce: FocusChangeEventObject) => {
        if (
          runningAppPid === fce.focusedApp?.pid ||
          fce.focusedApp?.appid === Number(runningApp?.appid || 0)
        ) {
          return;
        }
        runningAppPid = fce.focusedApp?.pid;
        await refresh();
      }, config.FocusChangeEventWait)
    );
    refresh();
    return () => {
      unregister();
    };
  }, []);

  const handleDropDownChange = debounce(
    wrap(
      async (data: SingleDropdownOption) => {
        const appid = Number(Router.MainRunningApp?.appid || 0);
        const page = data.data;
        setSelectedPage(page);
        saveLastSelectedPage(appid, page);
        sketchCanvasRef?.resetCanvas();
        const canvasPaths = await loadPage(appid, page);
        sketchCanvasRef?.loadPaths(canvasPaths);
      },
      (f, d: SingleDropdownOption) => {
        // wrap with disabled state
        setDisableState(true);
        return f(d).finally(() => setDisableState(false));
      }
    ),
    config.DropdownChangeEventWait
  );

  let deleteStateTimer: NodeJS.Timeout;
  const handleDeleteButtonClick = debounce(
    wrap(
      async (_e: MouseEvent) => {
        const appid = Number(Router.MainRunningApp?.appid || 0);
        const page = selectedPage;
        clearTimeout(deleteStateTimer);
        if (deleteState) {
          sketchCanvasRef?.resetCanvas();
          await deletePage(appid, page);
          const p = pages.find((p) => p.data === page);
          if (p) {
            // set the page dropdown option label back to empty
            p.label = <PageLabel page={page} timestamp={0} />;
            setPages([...pages]); // supply a shallow copy to force a refresh
          }
        } else {
          // shows the confirm prompt for a limited amount of time
          deleteStateTimer = setTimeout(
            () => setDeleteState(false),
            config.TapToConfirmTimeout
          );
        }
        setDeleteState(!deleteState);
      },
      (f, e: MouseEvent) => {
        // wrap with disabled state
        setDisableState(true);
        return f(e).finally(() => setDisableState(false));
      }
    ),
    config.DeleteButtonClickWait
  );

  // debounced canvas stroke saves the scribble on-the-fly to disk
  const handleCanvasStroke = debounce(
    async (_path: CanvasPath, _isEraser: boolean) => {
      const appid = Number(Router.MainRunningApp?.appid || 0);
      const page = selectedPage;
      const canvasPaths = await sketchCanvasRef?.exportPaths();
      const timestamp = await savePage(appid, page, canvasPaths || []);
      const p = pages.find((p) => p.data === page);
      if (p) {
        // set the dropdown option label with the timestamp
        p.label = <PageLabel page={page} timestamp={timestamp} />;
        setPages([...pages]); // supply a shallow copy to force a refresh
      }
    },
    config.CanvasSaveWait
  );

  return (
    <div
      style={{
        height: "100%",
        margin: "-0.4rem",
        overflow: "hidden",
        backgroundImage: `url(${background})`,
        backgroundPosition: "center",
      }}
    >
      <PanelSection title={runningApp?.display_name || "Steam"}>
        <PanelSectionRow>
          <Dropdown
            focusable={true}
            disabled={disableState}
            rgOptions={pages}
            selectedOption={selectedPage}
            onChange={handleDropDownChange}
          />
        </PanelSectionRow>
        <div style={{ marginTop: "0.5rem" }}>
          <div
            style={{
              position: "absolute",
              zIndex: 1,
              display: "flex",
              flexDirection: "row",
              height: "2rem",
            }}
          >
            <Button
              disabled={disableState}
              onClick={() => {
                setEraserMode(!eraserMode);
                sketchCanvasRef?.eraseMode(!eraserMode);
              }}
            >
              <span style={{ padding: "0.5rem" }}>
                {eraserMode ? <FaPenFancy /> : <FaEraser color="red" />}
              </span>
            </Button>
            <Button disabled={disableState} onClick={handleDeleteButtonClick}>
              <span style={{ padding: "0.5rem" }}>
                <FaTrash />
                {deleteState ? "Tap to confirm" : undefined}
              </span>
            </Button>
          </div>
          <ReactSketchCanvas
            ref={sketchCanvasRefCallback}
            strokeColor={config.CanvasStrokeColor}
            canvasColor={config.CanvasBackgroundColor}
            strokeWidth={config.CanvasStrokeWidth}
            eraserWidth={config.CanvasEraserWidth}
            height="19.5rem"
            style={{ zIndex: 0 }}
            onStroke={handleCanvasStroke}
          />
        </div>
      </PanelSection>
    </div>
  );
};

export default definePlugin((serverApi: ServerAPI) => {
  backend.setServerAPI(serverApi);

  return {
    title: <div className={staticClasses.Title}>Notebook</div>,
    content: <Content serverAPI={serverApi} />,
    icon: <FaBookOpen />,
    onDismount() {},
  };
});
