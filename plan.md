1. **Remove `backgroundFrameStyle` from `Game.tsx`**: The background is a full wallpaper. Using absolute positioning `backgroundFrameStyle` based on an imaginary frame in the background is causing the messy layout.
2. **Create `.hyper-main-frame` in `hyper-ui.css`**: This will wrap the sidebar and the game board on desktop, providing a unified container using `panel-frame.png` border image.
3. **Modify `Game.tsx` to use `.hyper-main-frame`**:
   - Wrap `hyper-game-layout` in `.hyper-main-frame`.
   - Remove `hyper-sidebar-frame` since the whole thing is inside the main frame now.
4. **Disable individual frames**:
   - In `GameBoard.tsx`, disable `boardFrame` rendering in Pixi on desktop (or disable it globally if it's handled by HTML now).
   - Alternatively, keep the inner board frame but make the whole layout use `hyper-shell`.
