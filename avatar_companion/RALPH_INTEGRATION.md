# Ralph Robot Integration

## Overview

Ralph robot has been integrated into the avatar environment alongside the waifu VRM avatar. Both models now appear together in the 3D scene.

## Implementation Details

### Model Loading
- **Ralph**: FBX model with PBR textures loaded from `/assets/de84bbd4-e87c-45ca-8ca6-cb5106865ea4/`
- **Textures Applied**:
  - Diffuse (texture_diffuse_00.png)
  - Normal (texture_normal_00.png)
  - Metallic (texture_metallic_00.png)
  - Roughness (texture_roughness_00.png)

### Positioning
- **Waifu**: Center of scene (0, 0, 0)
- **Ralph**: Left side of scene (-1.5, 0, 0)
- **Camera**: Adjusted to show both models
- **Camera Target**: Between both models (-0.75, 1.2, 0)

### Features
- ✅ PBR material rendering with all textures
- ✅ Shadow casting and receiving
- ✅ Subtle idle animation (breathing/rotation)
- ✅ Positioned to face the waifu
- ✅ Graceful error handling (app continues if Ralph fails to load)

## File Changes

### Modified Files
- `avatar_companion/assets/cliente_final.html`
  - Added `ralphModel` global variable
  - Added `loadRalph()` function
  - Updated `init()` to load both models
  - Adjusted camera position and target
  - Enabled shadows in renderer
  - Added subtle animation for Ralph

## Usage

1. Start the server:
   ```bash
   cd avatar_companion
   python server.py
   ```

2. Open in browser:
   ```
   http://localhost:5001
   ```

3. Both models will load:
   - Waifu (VRM) in the center
   - Ralph (FBX) on the left

## Customization

### Adjust Ralph Position
Edit `loadRalph()` function in `cliente_final.html`:
```javascript
ralphScene.position.set(-1.5, 0, 0); // X, Y, Z position
ralphScene.scale.set(1, 1, 1); // Scale multiplier
ralphScene.rotation.y = Math.PI / 2.5; // Rotation angle
```

### Adjust Camera
Edit `init()` function:
```javascript
camera.position.set(0, 1.4, 3.5); // Camera position
controls.target.set(-0.75, 1.2, 0); // Camera target (look-at point)
```

### Animation Speed
Edit the animation in `animate()` function:
```javascript
ralphModel.rotation.y = ralphModel.userData.initialRotation + 
    Math.sin(clock.elapsedTime * 0.5) * 0.05; // Speed: 0.5, Amplitude: 0.05
```

## Troubleshooting

### Ralph Not Appearing
1. Check browser console for errors
2. Verify assets are in correct path: `/assets/de84bbd4-e87c-45ca-8ca6-cb5106865ea4/`
3. Check Network tab for failed asset loads

### Textures Not Loading
1. Verify all texture files exist
2. Check file paths in `loadRalph()` function
3. Check browser console for 404 errors

### Positioning Issues
1. Adjust `ralphScene.position` values
2. Adjust `ralphScene.scale` if model is too large/small
3. Adjust camera position and target

## Next Steps

Potential enhancements:
- Add animations for Ralph (idle, talking, etc.)
- Sync Ralph's animations with waifu's speech
- Add interaction between the two avatars
- Add more robots to the scene
