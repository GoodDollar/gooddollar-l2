import urllib.request, json

def rpc(method, params):
    req = urllib.request.Request(
        'http://localhost:8545',
        data=json.dumps({'jsonrpc':'2.0','method':method,'params':params,'id':1}).encode(),
        headers={'Content-Type': 'application/json'}
    )
    with urllib.request.urlopen(req, timeout=5) as r:
        return json.loads(r.read().decode()).get('result', None)

NEW_SPLITTER = '0x3abBB0D6ad848d64c8956edC9Bf6f18aC22E1485'
NEW_ENGINE   = '0x021DBfF4A864Aa25c51F0ad2Cd73266Fde66199d'
CORRECT_GDT  = '0x36c02da8a0983159322a80ffe9f24b1acff8b570'

print("=== GOO-402 / GOO-450 Verification ===")

code = rpc('eth_getCode', [NEW_SPLITTER, 'latest'])
hex_len = len(code)
print(f"UBIFeeSplitter bytecode: {hex_len} hex string len ({(hex_len-2)//2} bytes)")
print(f"  threshold >=8404: {'PASS' if hex_len >= 8404 else 'FAIL'} (got {hex_len})")

gdt_raw = rpc('eth_call', [{'to': NEW_SPLITTER, 'data': '0x119e5bf3'}, 'latest'])
gdt = '0x' + gdt_raw[-40:] if gdt_raw else 'ERROR'
print(f"UBIFeeSplitter.goodDollar(): {gdt}")
print(f"  == correct GDT: {'PASS' if gdt.lower() == CORRECT_GDT else 'FAIL'}")

engine_code = rpc('eth_getCode', [NEW_ENGINE, 'latest'])
print(f"PerpEngine bytecode: {len(engine_code)} hex chars ({(len(engine_code)-2)//2} bytes)")
print(f"  deployed: {'PASS' if len(engine_code) > 2 else 'FAIL'}")
