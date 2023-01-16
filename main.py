import os
import sys
# append py_modules to PYTHONPATH
sys.path.append(os.path.dirname(os.path.realpath(__file__))+"/py_modules")

import pathlib

HOMEBREW_DIR = str(pathlib.Path(__file__).parents[2])
NOTES_SAVE_DIR = f"{HOMEBREW_DIR}/notebook"

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
        pass

    # Function called first during the unload process, utilize this to handle your plugin being removed
    async def _unload(self):
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
