#!/usr/bin/env python3
"""Headless Playwright harness for Echo Loop.

Serves the repository over http, opens the game in headless Chromium, then solves
each level with its scripted plan from tests/solutions.js. Phaser's own request
loop is *slept* so the harness drives the deterministic 60 Hz `scene.step()` by
hand -- the same run plays back byte-for-byte every time.

Usage:
    python tests/harness.py            # solve every level
    python tests/harness.py 1 3        # solve only levels 1 and 3
"""
import functools
import http.server
import os
import socket
import socketserver
import sys
import threading

from playwright.sync_api import sync_playwright

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


class _Server(socketserver.ThreadingTCPServer):
    allow_reuse_address = True
    daemon_threads = True


def _free_port():
    s = socket.socket()
    s.bind(("127.0.0.1", 0))
    port = s.getsockname()[1]
    s.close()
    return port


class Harness:
    def __init__(self):
        self.errors = []
        self.port = _free_port()
        handler = functools.partial(http.server.SimpleHTTPRequestHandler, directory=ROOT)
        self.httpd = _Server(("127.0.0.1", self.port), handler)
        self._thread = threading.Thread(target=self.httpd.serve_forever, daemon=True)
        self._pw = None
        self.browser = None
        self.page = None

    # -- lifecycle ---------------------------------------------------------
    def __enter__(self):
        self.start()
        return self

    def __exit__(self, *exc):
        self.close()

    def start(self):
        self._thread.start()
        self._pw = sync_playwright().start()
        self.browser = self._pw.chromium.launch()
        self.page = self.browser.new_page()
        self.page.on("console", self._on_console)
        self.page.on("pageerror", lambda e: self.errors.append(str(e)))
        self.page.goto(f"http://127.0.0.1:{self.port}/index.html")
        self.page.wait_for_function("() => !!window.__echoLoop")
        self.page.wait_for_function("() => !!window.Phaser")
        self.page.add_script_tag(path=os.path.join(ROOT, "tests", "bot.js"))
        solutions = os.path.join(ROOT, "tests", "solutions.js")
        if os.path.exists(solutions):
            self.page.add_script_tag(path=solutions)

    def _on_console(self, msg):
        if msg.type == "error":
            self.errors.append(msg.text)

    def close(self):
        try:
            if self.browser:
                self.browser.close()
        finally:
            if self._pw:
                self._pw.stop()
            self.httpd.shutdown()
            self.httpd.server_close()

    # -- driving the game --------------------------------------------------
    def goto(self, level):
        """Start a level and sleep Phaser's loop so we can step it ourselves."""
        self.page.evaluate(
            """(lv) => {
                const g = window.__echoLoop;
                g.loop.wake();
                g.scene.stop('Menu');
                g.scene.stop('Win');
                g.scene.start('Game', { level: lv });
            }""",
            level,
        )
        self.page.wait_for_function(
            """() => {
                const g = window.__echoLoop;
                const s = g.scene.getScene('Game');
                return !!s && !!s.player && s.state === 'play' && g.scene.isActive('Game');
            }"""
        )
        self.page.evaluate("() => window.__echoLoop.loop.sleep()")

    def solve(self, name):
        return self.page.evaluate(
            "(n) => { const s = window.__solutions[n];"
            " if (!s) throw new Error('no solution: ' + n); return s(); }",
            name,
        )

    def eval(self, expr):
        return self.page.evaluate(expr)

    def level_count(self):
        return self.eval("() => window.__bot.levelCount()")


def main(argv):
    wanted = [int(a) for a in argv] if argv else None
    ok = True
    with Harness() as h:
        n = h.level_count()
        for i in range(n):
            if wanted and (i + 1) not in wanted:
                continue
            h.goto(i)
            name = f"level_{i + 1}"
            try:
                h.solve(name)
            except Exception as e:  # noqa: BLE001 - report and keep going
                print(f"[FAIL] level {i + 1}: {e}")
                ok = False
                continue
            if h.eval("() => window.__bot.done()"):
                loops = h.eval("() => window.__bot.loops() + 1")
                print(f"[PASS] level {i + 1} solved in {loops} loop(s)")
            else:
                state = h.eval("() => window.__bot.state()")
                print(f"[FAIL] level {i + 1} not solved (state={state})")
                ok = False
        if h.errors:
            ok = False
            print("Console errors:")
            for e in h.errors:
                print("  -", e)
        else:
            print("No console errors.")
    print("RESULT:", "PASS" if ok else "FAIL")
    return 0 if ok else 1


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
