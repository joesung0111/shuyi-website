"""Build transparent logo foregrounds from the supplied flattened JPEG files.

The source JPEGs stay untouched. Their RGB values are copied into the output;
only an alpha channel is derived to separate the logo artwork from its paper or
black background so that it can sit above the translucent crystal layer.

Requires Pillow and NumPy (build-time only):
    python3 -m pip install Pillow numpy
    python3 scripts/prepare_logo_layers.py
"""

from pathlib import Path

import numpy as np
from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "素材"


def light_background(image: np.ndarray) -> np.ndarray:
    """Fit a gentle color field from the empty edge bands of the light JPEG."""
    height, width, _ = image.shape
    y, x = np.mgrid[0:height, 0:width]
    x = (x - width / 2) / (width / 2)
    y = (y - height / 2) / (height / 2)
    design = np.stack(
        [np.ones_like(x), x, y, x * y, x * x, y * y], axis=-1
    )

    # The original mark and wordmark sit within the center; these outer bands
    # capture only the JPEG's warm paper gradient and texture.
    empty = np.zeros((height, width), dtype=bool)
    empty[:125, :] = True
    empty[-105:, :] = True
    empty[:, :230] = True
    empty[:, -230:] = True
    coefficients = np.linalg.lstsq(
        design[empty], image[empty], rcond=None
    )[0]
    return design @ coefficients


def make_layer(source: str, destination: str, light: bool) -> None:
    rgb_image = Image.open(ASSETS / source).convert("RGB")
    rgb = np.asarray(rgb_image, dtype=np.float32)

    if light:
        background = light_background(rgb)
        difference = np.linalg.norm(rgb - background, axis=2)
        low, high = 9.0, 22.0
    else:
        # The dark master uses a nearly pure black background.
        difference = np.max(rgb, axis=2)
        low, high = 4.0, 14.0

    alpha = np.clip((difference - low) / (high - low), 0.0, 1.0)
    alpha = np.rint(alpha * 255).astype(np.uint8)

    # Keep the supplied logo pixels unchanged; transparency is carried only by
    # alpha so the foreground artwork retains its original color and shading.
    output = np.dstack((rgb.astype(np.uint8), alpha))
    Image.fromarray(output, mode="RGBA").save(
        ASSETS / destination, format="PNG", optimize=True
    )


if __name__ == "__main__":
    make_layer("淺色系-1K.jpeg", "logo-layer-light.png", light=True)
    make_layer("深色系-1K.jpeg", "logo-layer-dark.png", light=False)
    print("Prepared transparent light and dark logo layers.")
