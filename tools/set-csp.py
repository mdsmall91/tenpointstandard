"""
Set the Content-Security-Policy meta tag on every page from one place.

GitHub Pages cannot send headers, so the policy rides in a <meta> tag. It
lists exactly what the site loads: its own files, Google Analytics, Google
Fonts, the Mailchimp signup (a JSONP script from list-manage.com) and the
model proxy Worker. Anything else, including a script someone manages to
inject, is refused by the browser.

The few inline scripts (TPA.init(), the two redirects) are allowed by their
sha256 hash, computed here, so editing one means running this again. A page
whose inline script changed without a re-run fails closed: that script stops
running and the console says so.

Run:  python tools/set-csp.py
"""

import base64
import hashlib
import pathlib
import re

ROOT = pathlib.Path(__file__).resolve().parent.parent
SKIP = {'worker', 'tests', 'docs', 'node_modules', '.git'}

GOOGLE = ('https://*.google-analytics.com https://*.analytics.google.com '
          'https://*.googletagmanager.com https://*.g.doubleclick.net https://*.google.com')
PROXY = 'https://tenpoint-model-proxy.coloradojeeper-small.workers.dev http://localhost:8788'


def policy(hashes):
    return '; '.join([
        "default-src 'self'",
        "script-src 'self' " + ''.join(f"'{h}' " for h in hashes) +
        'https://*.googletagmanager.com https://*.list-manage.com',
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
        "font-src 'self' data: https://fonts.gstatic.com",
        "img-src 'self' data: " + GOOGLE,
        "connect-src 'self' " + PROXY + ' ' + GOOGLE,
        "object-src 'none'",
        "base-uri 'self'",
        "form-action 'self' https://*.list-manage.com",
    ])


INLINE = re.compile(r'<script>(.*?)</script>', re.S)
META = re.compile(r'<meta http-equiv="Content-Security-Policy" content="[^"]*">\n')
VIEWPORT = re.compile(r'(<meta name="viewport"[^>]*>\n)')


def main():
    changed = 0
    for page in sorted(ROOT.rglob('*.html')):
        rel = page.relative_to(ROOT)
        if rel.parts[0] in SKIP or rel.name.startswith('google'):
            continue
        s = page.read_text(encoding='utf-8')
        hashes = ['sha256-' + base64.b64encode(hashlib.sha256(m.encode('utf-8')).digest()).decode()
                  for m in INLINE.findall(s)]
        tag = f'<meta http-equiv="Content-Security-Policy" content="{policy(hashes)}">\n'
        new = META.sub('', s)
        new, n = VIEWPORT.subn(lambda m: m.group(1) + tag, new, count=1)
        if not n:
            print(f'  no viewport meta, skipped: {rel}')
            continue
        if new != s:
            page.write_text(new, encoding='utf-8')
            changed += 1
            print(f'  {rel}')
    print(f'{changed} page(s) updated')


if __name__ == '__main__':
    main()
