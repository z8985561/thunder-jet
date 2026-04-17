import subprocess, os, time

os.environ['NO_PROXY'] = '*'
os.environ['PYTHONIOENCODING'] = 'utf-8'

BU = r'C:\Users\Administrator\.workbuddy\binaries\python\versions\3.14.3\Scripts\browser-use.exe'
SCREENSHOTS = r'F:\workbuddy_output\thunder-jet'

def run_cmd(args):
    r = subprocess.run([BU] + args, capture_output=True, text=True, encoding='utf-8')
    return r.stdout.strip(), r.stderr.strip()

def eval_js(js):
    out, _ = run_cmd(['eval', js])
    for line in out.split('\n'):
        if line.startswith('result:'):
            return line[7:].strip()
    return out

# Open game
print("Opening game...")
run_cmd(['--headed', 'open', 'http://localhost:5175/'])
time.sleep(2)

# Canvas is at left=776 on a 2052px viewport
# Canvas width=500, so center = 776 + 250 = 1026
# Title is at ~y=490 in canvas coords => page y=490 (top=0)
# Start button appears to be around y=700 in canvas => page y=700

# Click the START button area
print("Clicking START button at (1026, 700)...")
run_cmd(['click', '1026', '700'])
time.sleep(2)

# Take screenshot
run_cmd(['screenshot', os.path.join(SCREENSHOTS, 'ss-game-start.png')])

# Check canvas content - scan for game elements
# Player ship should be at bottom center
# Enemies come from top
# HUD at top

print("\n=== Scanning canvas for game elements ===")

# Sample a grid of the canvas
for cy_pct in [0.02, 0.1, 0.3, 0.5, 0.7, 0.85, 0.95]:
    for cx_pct in [0.1, 0.3, 0.5, 0.7, 0.9]:
        cx = int(500 * cx_pct)
        cy = int(1024 * cy_pct)
        px = eval_js(f'''(() => {{
            const c = document.querySelector("canvas");
            const ctx = c.getContext("2d");
            const d = ctx.getImageData({cx}, {cy}, 1, 1).data;
            return d[0] + "," + d[1] + "," + d[2];
        }})()''')
        r, g, b = map(int, px.split(','))
        marker = ""
        if r > 100 or g > 100 or b > 100:
            marker = " <<<"
        if r > 50 or g > 50 or b > 50:
            marker += " *"
        print(f"  canvas({cx:3d},{cy:4d}) [{cx_pct:.0%},{cy_pct:.0%}]: rgb({r:3d},{g:3d},{b:3d}){marker}")

# Move player around with arrow keys
print("\n=== Moving player for 3 seconds ===")
for i in range(15):
    run_cmd(['keys', 'ArrowLeft'])
    time.sleep(0.1)
    run_cmd(['keys', 'ArrowRight'])
    time.sleep(0.1)
run_cmd(['screenshot', os.path.join(SCREENSHOTS, 'ss-after-move.png')])

# Use bomb
print("\n=== Using bomb ===")
run_cmd(['keys', 'Space'])
time.sleep(0.5)
run_cmd(['screenshot', os.path.join(SCREENSHOTS, 'ss-bomb.png')])

# Check for bomb flash
flash = eval_js('''(() => {
    const c = document.querySelector("canvas");
    const ctx = c.getContext("2d");
    const d = ctx.getImageData(250, 512, 1, 1).data;
    return d[0] + "," + d[1] + "," + d[2];
})()''')
print(f"  Center after bomb: rgb({flash})")

# Continue playing for a bit
print("\n=== Continuing play... ===")
for i in range(30):
    run_cmd(['keys', 'ArrowLeft'])
    time.sleep(0.05)
    run_cmd(['keys', 'ArrowRight'])
    time.sleep(0.05)

time.sleep(2)
run_cmd(['screenshot', os.path.join(SCREENSHOTS, 'ss-extended-play.png')])

# Final scan
print("\n=== Final canvas scan ===")
for cy_pct in [0.02, 0.1, 0.5, 0.85]:
    for cx_pct in [0.1, 0.5, 0.9]:
        cx = int(500 * cx_pct)
        cy = int(1024 * cy_pct)
        px = eval_js(f'''(() => {{
            const c = document.querySelector("canvas");
            const ctx = c.getContext("2d");
            const d = ctx.getImageData({cx}, {cy}, 1, 1).data;
            return d[0] + "," + d[1] + "," + d[2];
        }})()''')
        r, g, b = map(int, px.split(','))
        print(f"  ({cx:3d},{cy:4d}): rgb({r:3d},{g:3d},{b:3d})")

# Check if game over
game_over_check = eval_js('''(() => {
    const c = document.querySelector("canvas");
    const ctx = c.getContext("2d");
    // Check center for "Game Over" text
    let bright = 0;
    for(let y = 400; y < 600; y += 5) {
        for(let x = 100; x < 400; x += 5) {
            const d = ctx.getImageData(x, y, 1, 1).data;
            if(d[0] > 150 || d[1] > 150 || d[2] > 150) bright++;
        }
    }
    return bright;
})()''')
print(f"\n  Center bright pixels (game over check): {game_over_check}")

run_cmd(['close'])
print("Done.")
