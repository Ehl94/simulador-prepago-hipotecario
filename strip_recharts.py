import codecs

with codecs.open("index.html", "r", "utf-8") as f:
    text = f.read()

start_marker = "// ── GRÁFICO ESCENARIOS (MULTI-LÍNEA RECHARTS)"
end_marker = "// ── GRÁFICO ESCENARIOS (MULTI-LÍNEA)"

start = text.find(start_marker)
end = text.find(end_marker, start)

if start != -1 and end != -1:
    new_text = text[:start] + text[end:]
    with codecs.open("index.html", "w", "utf-8") as f:
        f.write(new_text)
    print("Found and removed the Recharts component from index.html.")
else:
    print("Markers not found.")
