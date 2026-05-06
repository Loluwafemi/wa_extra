To execute the make_icon script which helps generate icon use:

`pip install pillow --break-system-packages -q && python3 /home/claude/wa_extra/scripts/make_icons.py`


To execute the make_docs script: which create document on how to use extension, use:

`python3 /home/claude/wa_extra/scripts/make_docs.py 2>&1`


To create extension zip: use
`cd /home/claude/wa_extra && zip -r ./output/io.whatsapp-extractor.zip whatsapp-extractor/ && echo "Package size: $(du -sh ./output/io.whatsapp-extractor.zip)"`