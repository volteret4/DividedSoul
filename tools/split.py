#!/usr/bin/env python3
"""Texto por capítulos de Divided Soul: The Life of Marvin Gaye (David Ritz, Omnibus Press, ed. de 1991).

Uso: python3 -I tools/split.py <dir_html> <dir_salida>

Lee directamente los HTML del ePub (OEBPS/*.htm), que traen la paginación impresa (anclas <a id="pageN"/>).
Capítulo 1: la introducción a la edición de 1991 y el prefacio; 2-37: los capítulos 1-36 del libro;
38: la discografía. Las cabeceras (número y título) salen como «## …»; las fotos y sus pies se descartan.
Escribe <dir>/NN.txt (un párrafo por línea, «[pág. N]» con la página impresa en que empieza) y
<dir>/book.json (párrafos {ch, sec, segs: [[pág, texto]]}, el formato de tools/refs.py y de
pdfpages.py --impresas; sec es la última cabecera).
"""
import html
import json
import re
import sys
from pathlib import Path

FILES = {1: ['int', 'prf']} | {n + 1: [f'c{n:02d}'] for n in range(1, 37)} | {38: ['mar']}
BREAK = re.compile(r'<a id="page([^"]+)"\s*/>')
PARA = re.compile(r'<(p|h[1-6])\b([^>]*)>(.*?)</\1>', re.S)
SKIP = ('class="caption', 'class="cover"')
FIX = {('c23', '23'): '223'}  # erratas de las anclas del ePub


def clean(s):
    s = re.sub(r'<sup[^>]*>.*?</sup>', '', s, flags=re.S)
    s = re.sub(r'<br\s*/?>', ' ', s)
    return re.sub(r'\s+', ' ', html.unescape(re.sub(r'<[^>]+>', '', s))).strip()


def page_of(t):
    return int(t) if t.isdigit() else t


def main(src, out):
    out = Path(out)
    out.mkdir(parents=True, exist_ok=True)
    paras = []
    for ch, names in FILES.items():
        page, sec, text = None, None, []
        for name in names:
            doc = next(Path(src).glob(f'*_{name}_r1.htm')).read_text()
            body = doc[doc.index('<body'):]
            for (f, bad), good in FIX.items():
                if f == name:
                    body = body.replace(f'<a id="page{bad}"/>', f'<a id="page{good}"/>')
            pos = 0
            for m in PARA.finditer(body):
                for b in BREAK.findall(body[pos:m.start()]):
                    page = page_of(b)
                pos = m.end()
                tag, attrs, inner = m.groups()
                parts = BREAK.split(inner)          # [texto, pág, texto, pág, …]
                segs, cur = [], page
                for i, part in enumerate(parts):
                    if i % 2:
                        cur = page_of(part)
                        continue
                    t = clean(part)
                    if t:
                        segs.append([cur, t])
                page = cur
                if not segs or any(k in attrs for k in SKIP):
                    continue
                line = ' '.join(t for _, t in segs)
                if tag != 'p':
                    sec = line
                    text.append(f'## {line}')
                    continue
                paras.append({'ch': ch, 'sec': sec, 'segs': segs})
                text.append(f'[pág. {segs[0][0]}] {line}')
        (out / f'{ch:02d}.txt').write_text('\n\n'.join(text) + '\n')
        n = sum(len(t.split()) for p in paras if p['ch'] == ch for _, t in p['segs'])
        print(f'cap. {ch}: {n} palabras, págs. {next((p["segs"][0][0] for p in paras if p["ch"] == ch), "?")}–{page}')
    (out / 'book.json').write_text(json.dumps(paras, ensure_ascii=False))


if __name__ == '__main__':
    main(*sys.argv[1:])
