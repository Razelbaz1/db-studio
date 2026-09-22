"""Wraps src/page.html (the artifact body) into a standalone index.html for GitHub Pages."""
import re, pathlib
body = pathlib.Path("src/page.html").read_text(encoding="utf-8")
m = re.search(r"<title>(.*?)</title>", body); title = m.group(1) if m else "DB Studio"
body = body.replace(m.group(0), "", 1) if m else body
html = f"""<!doctype html>
<html lang="he" dir="rtl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{title}</title>
<meta name="description" content="סביבת לימוד אינטראקטיבית לקורס תכנון בסיסי נתונים">
<style>:root{{color-scheme:light dark}}body{{margin:0}}img{{max-width:100%}}[hidden]{{display:none!important}}</style>
</head>
<body>
{body}
</body>
</html>
"""
pathlib.Path("index.html").write_text(html, encoding="utf-8")
print("index.html written,", len(html), "chars")
