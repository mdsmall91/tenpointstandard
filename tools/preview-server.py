#!/usr/bin/env python3
"""
The local preview server.

This exists instead of `python -m http.server` for one reason: the plain
server sends no cache headers at all. A browser handed an HTML document
with no `Cache-Control` and no `Expires` is allowed to invent a freshness
lifetime from the Last-Modified date, and it does. The result is a
preview that quietly serves a version of the site from hours or days ago
while the files on disk are current, and nothing in the browser says so.

That is not a theoretical problem here. It has now cost us twice:

  1. The journal drift suite reported 121 of 122 passing against a stale
     copy of its own test file, while real drift sat unnoticed on disk.
  2. A review pass opened the site and got a build several versions old,
     still asking for config.js?v=8 when disk was at v=17. The site
     looked broken because it was old, not because it was wrong.

Both were the same bug wearing different clothes. A preview whose answer
depends on the cache cannot be reviewed and cannot be tested, so this
server refuses to be cached at all. The `?v=` query strings on the site's
own assets stay as they are: those are for the real deployment, where
caching is wanted and correctness comes from the version changing.

Run:  python tools/preview-server.py [port]
      (or through .claude/launch.json, which is what the preview pane uses)
"""

import functools
import http.server
import os
import socket
import sys
import threading

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DEFAULT_PORT = 4174


class NoStoreHandler(http.server.SimpleHTTPRequestHandler):
    """SimpleHTTPRequestHandler that forbids caching of everything."""

    def end_headers(self):
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        http.server.SimpleHTTPRequestHandler.end_headers(self)

    def send_head(self):
        """Never answer 304. A conditional request answered Not Modified
        is served out of the same cache we just told the browser not to
        keep, which puts the stale copy straight back."""
        for header in ('If-Modified-Since', 'If-None-Match'):
            while header in self.headers:
                del self.headers[header]
        return http.server.SimpleHTTPRequestHandler.send_head(self)


class DualStackServer(http.server.ThreadingHTTPServer):
    """An IPv6 listener, for ::1.

    This is not decoration. "localhost" resolves to ::1 first on this
    machine, so an IPv4-only listener makes every single request wait
    out a failed IPv6 connection before falling back. Measured here at
    2.06 seconds per request against 0.013 on 127.0.0.1: a link check
    over 172 URLs goes from two seconds to six minutes, and the preview
    feels broken for a reason nothing in the page can explain.

    V6ONLY is cleared in case the platform will map IPv4 in for free.
    Windows will not, so `build` below binds IPv4 separately as well."""

    address_family = socket.AF_INET6

    def server_bind(self):
        try:
            self.socket.setsockopt(socket.IPPROTO_IPV6, socket.IPV6_V6ONLY, 0)
        except (AttributeError, OSError):
            pass
        return http.server.ThreadingHTTPServer.server_bind(self)


def build(port, handler):
    """One listener per loopback address.

    Windows will not accept an IPv4 connection on an IPv6 socket here
    even with IPV6_V6ONLY cleared, so relying on the mapping trades a
    slow 127.0.0.1 for a dead one. Two sockets is the honest answer:
    both spellings of loopback work, and neither pays a resolution
    penalty. Anything that cannot bind is skipped rather than fatal."""
    servers = []
    for family, address in ((socket.AF_INET6, '::1'), (socket.AF_INET, '127.0.0.1')):
        cls = DualStackServer if family == socket.AF_INET6 else http.server.ThreadingHTTPServer
        try:
            servers.append(cls((address, port), handler))
        except OSError:
            pass
    if not servers:
        raise SystemExit('preview: nothing could bind to port ' + str(port))
    return servers


def main():
    port = int(sys.argv[1]) if len(sys.argv) > 1 else DEFAULT_PORT
    handler = functools.partial(NoStoreHandler, directory=ROOT)
    servers = build(port, handler)
    for extra in servers[1:]:
        threading.Thread(target=extra.serve_forever, daemon=True).start()
    server = servers[0]
    print('Ten Point preview')
    print('  root     ' + ROOT)
    print('  serving  http://localhost:' + str(port))
    print('  caching  off, so what you see is what is on disk')
    print('')
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass


if __name__ == '__main__':
    main()
