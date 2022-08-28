import os

NOTES_SAVE_DIR = "/home/deck/homebrew/notebook"

class Plugin:
    # Asyncio-compatible long-running code, executed in a task when the plugin is loaded
    async def _main(self):
        pass

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
        return ret

    async def deletePage(self, appid: int, page: int) -> bool:
        pagePath = f"{NOTES_SAVE_DIR}/{appid}/{page}.json"
        try:
            os.unlink(pagePath)
        except FileNotFoundError as err:
            return False
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
        return pages
