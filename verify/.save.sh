#!/bin/bash
# usage: save.sh <hash> <name>
A=/home/box/agent-data/agents/d22aa74b-8fdf-45ff-aaac-7f131c1e52a1/assets
python3 -c "from PIL import Image; import sys; Image.open(sys.argv[1]).convert('RGB').save(sys.argv[2], 'PNG')" "$A/$1.webp" "/workspace/open-mind-extension/verify/$2" && ls -la "/workspace/open-mind-extension/verify/$2"
