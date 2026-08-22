// Brand values for email and any other surface that cannot import the design
// tokens.
//
// THIS IS A SYNCED COPY of src/data/design-tokens.js, not a second opinion.
// netlify/functions/ has its own dependency tree and is bundled by esbuild, so
// a relative import reaching back into src/ is fragile; public/consent.js is
// served verbatim to the browser and cannot import at all. Both therefore need
// the literals. tests/brand.test.mjs compares every value below against the
// tokens file and fails if they drift, which is the only thing keeping a synced
// copy honest.
//
// Email-specific constraints, so nobody "modernises" this into breakage:
//   - No SVG. Outlook's Word rendering engine drops it, so the seal is a table
//     cell with a letter in it, not the real mark.
//   - No CSS custom properties, no external stylesheet, no class names. Inline
//     styles only.
//   - Solid background colours on CTAs. Gradients are ignored by several
//     clients, and a gradient that fails to paint leaves white text on white.

export const BRAND = {
  siegel: '#0F766E',
  siegelLift: '#0D9488',
  siegelWash: '#E6F2F0',
  gold: '#FBBF24',
  ink: '#14201D',
  graphite: '#5A6360',
  rule: '#E2E7E5',
  paper: '#FCFCFA',
  white: '#FFFFFF',
};

/** The header block: teal ground, the Meister-Siegel "M", the wordmark. */
export const emailHeader = () => `
            <td style="background:${BRAND.siegel};padding:32px;text-align:center;">
              <div style="display:inline-block;width:56px;height:56px;line-height:56px;border-radius:28px;background:rgba(255,255,255,0.16);margin-bottom:12px;">
                <span style="color:${BRAND.white};font-size:28px;font-weight:700;font-family:Georgia,'Times New Roman',serif;">M</span>
              </div>
              <p style="margin:0;color:${BRAND.white};font-size:20px;font-weight:700;letter-spacing:-0.3px;">DeutschMeister</p>
            </td>`;

/** A call-to-action button cell. Solid, never a gradient — see the header note. */
export const ctaCell = (href, label) => `
                  <td style="border-radius:10px;background:${BRAND.siegel};">
                    <a href="${href}"
                       style="display:inline-block;padding:14px 28px;color:${BRAND.white};font-size:15px;font-weight:600;text-decoration:none;letter-spacing:-0.2px;">
                      ${label}
                    </a>
                  </td>`;
