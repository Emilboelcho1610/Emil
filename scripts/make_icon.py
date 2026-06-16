#!/usr/bin/env python3
"""Genererer et simpelt app-ikon (mørk baggrund + blå play-trekant) som PNG.
Ingen eksterne afhængigheder - bruger kun standardbiblioteket."""
import zlib, struct, sys, math

def png(path, size):
    bg   = (13, 15, 23)      # --bg
    panel= (28, 32, 48)      # --surface
    acc  = (79, 124, 255)    # --accent
    cx = cy = size / 2
    r_panel = size * 0.30

    rows = bytearray()
    for y in range(size):
        rows.append(0)  # filter byte: none
        for x in range(size):
            # afrundet baggrundsplade
            col = bg
            # rounded rect panel
            inset = size * 0.14
            rad = size * 0.18
            if inset <= x <= size-inset and inset <= y <= size-inset:
                # corner rounding
                inside = True
                for (ccx, ccy) in [(inset+rad, inset+rad),(size-inset-rad,inset+rad),
                                   (inset+rad,size-inset-rad),(size-inset-rad,size-inset-rad)]:
                    if ((x<inset+rad or x>size-inset-rad) and (y<inset+rad or y>size-inset-rad)):
                        if math.hypot(x-ccx, y-ccy) > rad and \
                           ((x<inset+rad)==(ccx<size/2)) and ((y<inset+rad)==(ccy<size/2)):
                            inside = False
                if inside:
                    col = panel
            # play-trekant
            tx0 = size*0.40; tx1 = size*0.66
            ty0 = size*0.34; ty1 = size*0.66
            if tx0 <= x <= tx1:
                frac = (x - tx0) / (tx1 - tx0)
                half = (ty1 - ty0) / 2 * (1 - frac)
                if cy-half <= y <= cy+half:
                    col = acc
            rows.extend(col)

    def chunk(typ, data):
        c = struct.pack('>I', len(data)) + typ + data
        return c + struct.pack('>I', zlib.crc32(typ + data) & 0xffffffff)

    sig = b'\x89PNG\r\n\x1a\n'
    ihdr = struct.pack('>IIBBBBB', size, size, 8, 2, 0, 0, 0)  # 8-bit RGB
    idat = zlib.compress(bytes(rows), 9)
    with open(path, 'wb') as f:
        f.write(sig + chunk(b'IHDR', ihdr) + chunk(b'IDAT', idat) + chunk(b'IEND', b''))
    print('skrev', path, size, 'x', size)

if __name__ == '__main__':
    png('tizen/icon.png', 512)
    png('webos/icon.png', 130)
    png('app/assets/icon.png', 512)
