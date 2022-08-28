import os
import asyncio
from aiohttp import web

NOTES_SAVE_DIR = "/home/deck/homebrew/notebook"

"""
Under the NOTES_SAVE_DIR, notebook pages will be stored under the games' appids.
Each page stored as json encoded CanvasPath[] named by their ids (e.g.: '0.json')

Additonally each game has a 'page' file storing the last selected page index.

The timestamp attribute is the file's modification time multiplied by 1000 so that it's
already in the format that javascript 'Date()' expects.
"""

class Plugin:
    # Asyncio-compatible long-running code, executed in a task when the plugin is loaded
    async def _main(self):
        async def pagehandler(request: web.BaseRequest):
            corsHeaders = {'Access-Control-Allow-Origin': '*','Access-Control-Allow-Methods': '*'}
            if request.method == "OPTIONS":
                return web.Response(headers=corsHeaders)
            if request.method == "POST":
                decReq = await request.json()
                if 'appid' in decReq and 'page' in decReq and 'data' in decReq:
                    ret = await self.savePage(self, appid=int(decReq['appid']), page=int(decReq['page']), data=decReq['data'])
                    return web.json_response(ret, headers=corsHeaders)
            elif request.method == "GET":
                if 'appid' in request.query and 'page' in request.query:
                    ret = await self.loadPage(self, appid=int(request.query['appid']), page=int(request.query['page']))
                    return web.json_response(ret, headers=corsHeaders)
            raise web.HTTPBadRequest(headers=corsHeaders)
        server = web.Server(pagehandler)
        runner = web.ServerRunner(server, handle_signals=True)
        await runner.setup()
        self._site = web.TCPSite(runner, host="localhost", port=0, reuse_port=True)
        await self._site.start()
        while True:
            await asyncio.sleep(3600)

    async def serverPageUrl(self) -> str:
        return 'http://%s:%s' % self._site._server.sockets[0].getsockname()

    async def loadPage(self, appid: int, page: int) -> {'page': int, 'timestamp': int, 'empty': bool, 'data': str}:
        pagePath = f"{NOTES_SAVE_DIR}/{appid}/{page}.json"
        ret = {'page': page, 'timestamp': 0, 'empty': True, 'data': ""}
        try:
            ret['timestamp'] = int(os.path.getmtime(pagePath)*1000)
            with open(pagePath, "r") as f:
                ret['data'] = f.read().strip()
                ret['empty'] = len(ret['data']) == 0
        except FileNotFoundError as err:
            pass
        except:
            pass
        return ret

    async def savePage(self, appid: int, page: int, data: str) -> {'timestamp': int}:
        pagePath = f"{NOTES_SAVE_DIR}/{appid}/{page}.json"
        ret = {'timestamp': 0}
        pageDir = os.path.dirname(pagePath)
        try:
            os.makedirs(pageDir, exist_ok=True)
            with open(pagePath, "w") as f:
                f.write(data)
            ret['timestamp'] = int(os.path.getmtime(pagePath)*1000)
        except OSError as err:
            pass
        except:
            pass
        return ret

    async def deletePage(self, appid: int, page: int) -> bool:
        pagePath = f"{NOTES_SAVE_DIR}/{appid}/{page}.json"
        try:
            os.unlink(pagePath)
        except FileNotFoundError as err:
            return False
        except:
            pass
        return True

    async def saveLastSelectedPage(self, appid: int, page: int) -> bool:
        lastSelectedPagePath = f"{NOTES_SAVE_DIR}/{appid}/page"
        lastSelectedPageDir = os.path.dirname(lastSelectedPagePath)
        try:
            os.makedirs(lastSelectedPageDir, exist_ok=True)
            with open(lastSelectedPagePath, "w") as f:
                f.write(str(page))
        except OSError as err:
            return False
        except:
            pass
        return True

    async def loadLastSelectedPage(self, appid: int) -> int:
        lastSelectedPagePath = f"{NOTES_SAVE_DIR}/{appid}/page"
        try:
            with open(lastSelectedPagePath, "r") as f:
                return int(f.read().strip())
        except FileNotFoundError as err:
            pass
        except ValueError as err:
            pass
        except:
            pass
        return 0

    async def listPages(self, appid: int) -> [{'page': int, 'timestamp': int, 'empty': bool}]:
        pagesPath = f"{NOTES_SAVE_DIR}/{appid}"
        lastSelectedPagePath = f"{NOTES_SAVE_DIR}/{appid}/page"
        pages = []
        try:
            with os.scandir(pagesPath) as it:
                for f in it:
                    if (f.is_file() and
                        f.name.endswith(".json") and
                        f.name.removesuffix(".json").isdecimal()):
                        pages.append({
                            'page': int(f.name.removesuffix(".json")),
                            'timestamp': int(f.stat().st_mtime * 1000),
                            'empty': f.stat().st_size == 0,
                        })
        except OSError as err:
            pass
        except ValueError as err:
            pass
        except:
            pass
        return pages
