#!/usr/bin/env python3
"""
Run the real Cloudflare Worker locally, the one that gets deployed.

`tools/dev-proxy.py` is a second, simpler implementation of the same
contract, and it is the quicker thing to develop against. It is not the
thing that ships. This runs `worker/src/index.js` itself, with its rate
limiter and its secret, so the code under test is the code that goes
live.

THE KEY IS WRITTEN AND THEN TAKEN BACK. wrangler reads the API key from
`worker/.dev.vars`, which means the key has to sit on disk inside the
repository while the Worker runs. This repository lives inside a synced
OneDrive folder, so a key left there is a key uploaded to Atwell's
tenant. It is written from ~/.secrets on start and deleted on exit, and
it is in .gitignore either way. The deployed Worker never uses this
path: there the key is a Cloudflare secret, stored encrypted, set once
with `npx wrangler secret put ANTHROPIC_API_KEY`.

Run:  python tools/worker-dev.py [port]        (default 8789)

Then in the browser console on the local site, before running a scan:
      CONFIG.MODEL_PROXY_URL_LOCAL = 'http://127.0.0.1:8789'
"""

import atexit
import io
import os
import subprocess
import sys

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
WORKER = os.path.join(REPO, 'worker')
DEV_VARS = os.path.join(WORKER, '.dev.vars')
NODE_DIRS = [
    os.path.join(os.environ.get('LOCALAPPDATA', ''), 'node', 'node-v22.20.0-win-x64'),
    os.path.join(os.environ.get('ProgramFiles', ''), 'nodejs'),
]


def find_key():
    """The key by its contents, not its filename. It has been renamed
    once already and the filename is not the thing that identifies it."""
    secrets = os.path.join(os.path.expanduser('~'), '.secrets')
    for name in sorted(os.listdir(secrets)):
        if 'README' in name.upper():
            continue
        path = os.path.join(secrets, name)
        if not os.path.isfile(path):
            continue
        try:
            value = io.open(path, encoding='utf-8').read().strip()
        except Exception:
            continue
        if value.startswith('sk-ant-'):
            return value, name
    return None, None


def remove_dev_vars():
    try:
        if os.path.exists(DEV_VARS):
            os.remove(DEV_VARS)
            print('\nremoved worker/.dev.vars')
    except OSError as e:
        print('\nCOULD NOT REMOVE worker/.dev.vars: ' + str(e))
        print('Delete it by hand. It holds the API key.')


def main():
    port = sys.argv[1] if len(sys.argv) > 1 else '8789'

    key, name = find_key()
    if not key:
        sys.exit('No Anthropic key found in ~/.secrets (looking for one starting sk-ant-).')

    env = dict(os.environ)
    for d in NODE_DIRS:
        if d and os.path.isdir(d):
            env['PATH'] = d + os.pathsep + env.get('PATH', '')
            break
    env['WRANGLER_SEND_METRICS'] = 'false'

    io.open(DEV_VARS, 'w', encoding='utf-8', newline='').write('ANTHROPIC_API_KEY=' + key + '\n')
    atexit.register(remove_dev_vars)

    print('Ten Point Worker (the real one)')
    print('  source   worker/src/index.js')
    print('  key      ~/.secrets/' + name + '  (copied to worker/.dev.vars, removed on exit)')
    print('  serving  http://127.0.0.1:' + port)
    print('')
    print("  In the browser console on the local site, before a scan:")
    print("    CONFIG.MODEL_PROXY_URL_LOCAL = 'http://127.0.0.1:" + port + "'")
    print('')

    try:
        subprocess.call(['npx', 'wrangler', 'dev', '--port', port, '--local'],
                        cwd=WORKER, env=env, shell=(os.name == 'nt'))
    except KeyboardInterrupt:
        pass
    finally:
        remove_dev_vars()


if __name__ == '__main__':
    main()
