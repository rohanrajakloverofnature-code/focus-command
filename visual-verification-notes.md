# Home Prediction Capsule Visual Verification

## 320 px mobile viewport

- Initial visual check found the 13-character `READING AHEAD` label ellipsized inside the compact Home-header prediction capsule.
- The approved capsule vocabulary was tightened to an 11-character maximum, and its internal icon/text spacing was reduced without changing the capsule’s external width, header slot, menu control, or Mini Achievement ticker.
- Follow-up visual check at the same 320 px viewport shows the active `READ AHEAD` icon-paired prediction fully visible, with no clipping, ellipsis, collision, or off-screen capsule content.

## 360 px and 390 px mobile viewports

- The active icon-paired `READ AHEAD` prediction remains fully visible at both widths.
- The capsule retains a visible gap from the fixed hamburger control and remains inside the compact header slot.
- No prediction text, icon, or chevron clipping or collision was observed.

## 430 px mobile viewport

- The active `READ AHEAD` prediction, its matching icon, and its chevron remain fully visible at the wide supported mobile width.
- The capsule stays within the intended compact header area with clean separation from the title block and hamburger control.

## Preserved surrounding behavior

- The prediction capsule remains in the marked compact header space.
- The hamburger control remains visible and separate from the capsule.
- The existing Mini Achievement ticker remains in its original full-width slot below the title row.
