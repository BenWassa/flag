from pathlib import Path


def replace(path: str, old: str, new: str) -> None:
    file = Path(path)
    text = file.read_text()
    if old not in text:
        raise SystemExit(f"Expected text not found in {path}: {old[:100]!r}")
    file.write_text(text.replace(old, new, 1))


replace(
    "src/styles/spatial.css",
    " * Earth owns the viewport and a single neutral translucent chooser is layered\n * over it. That surface deliberately uses no `backdrop-filter` blur, so the\n * exception does not create a continuous compositing/rendering cost on phone GPUs.",
    " * Earth owns the viewport and a single bounded neutral chooser is layered over\n * it. The chooser is ordinary opaque Atlas chrome: no backdrop tint, blur or\n * special compositing path competes with the geography behind and around it.",
)
replace(
    "src/styles/spatial.css",
    "/* Home-only translucent chooser. This is one surface over the Earth, not a\n   stack of glass cards. */",
    "/* Home-only chooser. This is one ordinary neutral Atlas surface over the\n   Earth, not a glass exception or a stack of cards. */",
)
replace(
    "src/styles/spatial.css",
    "  border: 1px solid color-mix(in srgb, var(--line-strong) 76%, transparent);\n  border-radius: var(--radius-tile);\n  background: color-mix(in srgb, var(--surface) 82%, transparent);\n  box-shadow: 0 0 0 1px rgba(10, 23, 37, .5), 0 18px 44px rgba(10, 23, 37, .45);",
    "  border: 1px solid var(--line);\n  border-radius: var(--radius-tile);\n  background: var(--canvas);\n  box-shadow: var(--depth-tile);",
)

replace(
    "DESIGN.md",
    "12. Modest radii and controlled depth; no default glassmorphism, bento dashboards, decorative gradients or excessive elevation. The Spatial Home chooser is the one documented neutral translucent exception.",
    "12. Modest radii and controlled depth; no glassmorphism, bento dashboards, decorative gradients or excessive elevation. Spatial Home may use one bounded neutral overlay where composition requires it, but that overlay remains ordinary opaque Atlas chrome.",
)
replace(
    "DESIGN.md",
    "- the chooser may use one neutral translucent surface with a thin structural edge and modest depth so the globe remains recognisable around it;\n- it is bounded to the width its four modes need, and its fill is roughly 82% rather than near-opaque: against the near-white space it used to sit on, opacity was a texture choice; against a planet it decides whether there is a planet behind the chooser at all. Text stays far clear of 4.5:1 at that value even over the deepest ocean;\n- do not nest translucent cards, add colourful gradients/glow or depend on decorative blur; a sufficiently opaque treatment without `backdrop-filter` is preferred when it is clearer or cheaper;",
    "- the chooser uses the same cool near-white neutral family as ordinary Atlas chrome, with a thin structural edge and restrained tile depth;\n- its surface is opaque, so ocean, land and night never tint the chrome as the globe moves behind it. The globe remains recognisable because the chooser is bounded and the Earth owns the full canvas around it, not because geography bleeds through the controls;\n- do not introduce translucent cards, colourful gradients/glow or decorative blur; Home is a composition exception, not a separate material system;",
)
replace(
    "DESIGN.md",
    "This is the sole translucency exception in the navigation system. It is page content, not a modal dialog: no `aria-modal`, focus trap or parallel open/close state is introduced.",
    "This is a composition exception in the navigation system, not a material exception. It is page content, not a modal dialog: no `aria-modal`, focus trap or parallel open/close state is introduced.",
)

replace(
    ".impeccable/design.json",
    '"surface": "neutral translucent surface at roughly 82% with a thin structural edge and modest depth, so the planet reads through it",',
    '"surface": "opaque cool near-white Atlas chrome with a thin neutral structural edge and restrained tile depth; the globe stays dominant around the bounded chooser without tinting it",',
)
replace(
    ".impeccable/design.json",
    '"fallback": "solid real-DOM surface in forced colours or wherever translucency is unsuitable"',
    '"fallback": "the same solid real-DOM material model; forced colours replaces palette values with system colours"',
)
replace(
    ".impeccable/design.json",
    '"The Spatial Home chooser is the sole neutral translucency exception; no nested glass, decorative blur, glow or gradients, and other Spatial command surfaces remain non-translucent",',
    '"Spatial Home is a bounded overlay composition, not a translucency exception: it uses ordinary opaque neutral Atlas chrome with no nested glass, decorative blur, glow or gradients",',
)

path = Path("tests/browser/spatial-home-overlay.spec.ts")
text = path.read_text()
marker = "  test('all four modes use the authoritative route and Back restores Home', async ({ page }) => {"
if marker not in text:
    raise SystemExit("Home overlay insertion point not found")

test = r'''  test('chooser material stays opaque Atlas chrome as the globe moves behind it', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await openHome(page);

    const chooser = page.locator('.spatial-command[data-surface="domains"]');
    const surface = async () => chooser.evaluate((element) => {
      const style = getComputedStyle(element);
      const canvas = getComputedStyle(document.documentElement).getPropertyValue('--canvas').trim();
      const probe = document.createElement('span');
      probe.style.color = canvas;
      document.body.append(probe);
      const canvasColour = getComputedStyle(probe).color;
      probe.remove();
      return {
        background: style.backgroundColor,
        canvas: canvasColour,
        image: style.backgroundImage,
        backdrop: style.backdropFilter,
        webkitBackdrop: (style as CSSStyleDeclaration & { webkitBackdropFilter?: string }).webkitBackdropFilter ?? '',
      };
    });

    const initial = await surface();
    expect(initial.background).toBe(initial.canvas);
    expect(initial.image).toBe('none');
    expect(['', 'none']).toContain(initial.backdrop);
    expect(['', 'none']).toContain(initial.webkitBackdrop);

    const stage = page.locator('.spatial-stage__surface');
    const box = (await stage.boundingBox())!;
    const drags = [
      { dx: box.width * 0.34, dy: 0 },
      { dx: -box.width * 0.58, dy: box.height * 0.08 },
    ];
    const backgrounds = [initial.background];
    await page.screenshot({ path: test.info().outputPath('home-material-default.png') });
    for (let index = 0; index < drags.length; index += 1) {
      await page.mouse.move(box.x + box.width * 0.5, box.y + box.height * 0.5);
      await page.mouse.down();
      await page.mouse.move(
        box.x + box.width * 0.5 + drags[index].dx,
        box.y + box.height * 0.5 + drags[index].dy,
        { steps: 12 },
      );
      await page.mouse.up();
      await page.waitForTimeout(250);
      backgrounds.push((await surface()).background);
      await page.screenshot({ path: test.info().outputPath(`home-material-rotated-${index + 1}.png`) });
    }
    expect(new Set(backgrounds)).toEqual(new Set([initial.canvas]));
  });

'''
path.write_text(text.replace(marker, test + marker, 1))
