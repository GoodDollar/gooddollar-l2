import urllib.request, json

def call(to, data, label):
    req = urllib.request.Request(
        'http://localhost:8545',
        data=json.dumps({'jsonrpc':'2.0','method':'eth_call',
            'params':[{'to':to,'data':data},'latest'],'id':1}).encode(),
        headers={'Content-Type': 'application/json'}
    )
    with urllib.request.urlopen(req, timeout=5) as r:
        resp = json.loads(r.read().decode())
        result = resp.get('result', resp.get('error', '?'))
        print(f'{label}: {result}')

PERP_SPLITTER = '0x976fcd02f7C4773dd89C309fBF55D5923B4c98a1'
call(PERP_SPLITTER, '0x119e5bf3', 'PERP.goodDollar()')
call(PERP_SPLITTER, '0xf851a440', 'PERP.admin()')
