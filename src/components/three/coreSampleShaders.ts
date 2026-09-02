/**
 * Custom GLSL for the geological core sample mesh.
 *
 * The vertex shader displaces every vertex along its normal by two combined
 * signals: a slow-drifting ambient noise (constant, gives the surface an
 * organic rock-like roughness instead of a perfect cylinder) and a
 * pointer-proximity bulge (computed in screen/clip space, so it tracks the
 * cursor correctly regardless of how the mesh is currently rotated). The
 * fragment shader bands color by height to read as sedimentary strata, adds
 * hand-rolled Lambert + Fresnel shading (this material intentionally never
 * touches the standard PBR/lighting pipeline — there's exactly one mesh in
 * the scene, so baking two fixed light directions in as uniforms is simpler
 * and cheaper than wiring up real THREE.Light objects), and mixes in an
 * emissive glow wherever the pointer bulge is active.
 */

export const coreSampleVertexShader = /* glsl */ `
  uniform float uTime;
  uniform vec2 uPointer;       // smoothed pointer, NDC space (-1..1)
  uniform float uPointerStrength; // 0..1 ramps up while the pointer is moving
  uniform float uAspect;
  uniform float uBaseAmplitude;
  uniform float uPointerAmplitude;
  uniform float uInfluenceRadius;

  varying vec3 vNormal;
  varying vec3 vViewPosition;
  varying float vLocalY;
  varying float vInfluence;

  // Compact hash-based 3D value noise. Cheaper and far less error-prone than
  // full simplex noise, and plenty organic-looking for a subtle rock surface.
  float hash(vec3 p) {
    p = fract(p * 0.3183099 + 0.1);
    p *= 17.0;
    return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
  }

  float valueNoise(vec3 x) {
    vec3 i = floor(x);
    vec3 f = fract(x);
    f = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(
        mix(hash(i + vec3(0.0, 0.0, 0.0)), hash(i + vec3(1.0, 0.0, 0.0)), f.x),
        mix(hash(i + vec3(0.0, 1.0, 0.0)), hash(i + vec3(1.0, 1.0, 0.0)), f.x),
        f.y
      ),
      mix(
        mix(hash(i + vec3(0.0, 0.0, 1.0)), hash(i + vec3(1.0, 0.0, 1.0)), f.x),
        mix(hash(i + vec3(0.0, 1.0, 1.0)), hash(i + vec3(1.0, 1.0, 1.0)), f.x),
        f.y
      ),
      f.z
    );
  }

  float fbm(vec3 p) {
    return valueNoise(p) * 0.6 + valueNoise(p * 2.13) * 0.4;
  }

  void main() {
    vLocalY = position.y;

    // Ambient organic roughness — slow drift over time so the surface never
    // looks perfectly static, independent of any pointer interaction.
    float ambient = fbm(position * 2.2 + vec3(0.0, uTime * 0.06, 0.0)) * 2.0 - 1.0;
    vec3 displaced = position + normal * ambient * uBaseAmplitude;

    // Screen-space distance from this vertex to the (smoothed) pointer.
    // Done in clip space so the influence circle is correct regardless of
    // the mesh's current rotation — a raycast against the *displaced* mesh
    // isn't meaningful mid-shader, but proximity in screen space reads just
    // as well for a "the light follows your cursor" effect and is far cheaper.
    vec4 clipPos = projectionMatrix * modelViewMatrix * vec4(displaced, 1.0);
    vec2 ndc = clipPos.xy / clipPos.w;
    float screenDist = distance(vec2(ndc.x * uAspect, ndc.y), vec2(uPointer.x * uAspect, uPointer.y));
    float influence = smoothstep(uInfluenceRadius, 0.0, screenDist) * uPointerStrength;
    vInfluence = influence;

    displaced += normal * influence * uPointerAmplitude;

    vec4 mvPosition = modelViewMatrix * vec4(displaced, 1.0);
    vViewPosition = -mvPosition.xyz;
    vNormal = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * mvPosition;
  }
`

export const coreSampleFragmentShader = /* glsl */ `
  uniform vec3 uColorLow;
  uniform vec3 uColorMid;
  uniform vec3 uColorHigh;
  uniform vec3 uGlowColor;
  uniform float uHeight;
  uniform float uTime;

  varying vec3 vNormal;
  varying vec3 vViewPosition;
  varying float vLocalY;
  varying float vInfluence;

  float hash21(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
  }

  void main() {
    vec3 normal = normalize(vNormal);
    vec3 viewDir = normalize(vViewPosition);

    // Sedimentary banding along the core's length, two frequencies layered
    // so bands don't feel perfectly periodic/artificial.
    float t = vLocalY / uHeight;
    float bands = sin(t * 46.0) * 0.5 + 0.5;
    float bandsSharp = smoothstep(0.35, 0.65, bands);
    float accentBands = smoothstep(0.82, 0.9, sin(t * 11.0 + 1.7) * 0.5 + 0.5);

    vec3 rock = mix(uColorLow, uColorHigh, bandsSharp);
    rock = mix(rock, uColorMid, accentBands * 0.65);

    // Fine mottling so flat bands don't read as a flat procedural gradient.
    float grain = hash21(vec2(vLocalY * 40.0, dot(normal.xz, vec2(31.0, 17.0))));
    rock *= 0.94 + grain * 0.12;

    // Hand-rolled two-light Lambert (key + cool fill) — this material is
    // intentionally not lit by real THREE.Light objects, see file header.
    vec3 keyDir = normalize(vec3(0.5, 0.85, 0.6));
    vec3 fillDir = normalize(vec3(-0.6, -0.2, -0.4));
    float key = max(dot(normal, keyDir), 0.0);
    float fill = max(dot(normal, fillDir), 0.0) * 0.32;
    // Floor raised well above an original 0.28, and the key light's weight
    // pulled down to compress the lit/shadowed range: this mesh spins
    // continuously, so whatever face is currently in shadow will be the
    // camera-facing one half the time, and against the hero's near-black
    // page background a low floor made that half of every rotation read as
    // almost nothing — confirmed by sampling actual rendered pixels, not
    // just eyeballed against a compressed screenshot.
    float diffuse = 0.58 + key * 0.62 + fill;

    // Fresnel rim for a premium, mineral-sheen edge highlight — also a
    // second line of defense against the mesh disappearing into the page
    // background, since it lights up edges regardless of diffuse facing.
    float fresnel = pow(1.0 - max(dot(normal, viewDir), 0.0), 2.4);

    vec3 color = rock * diffuse;
    color += fresnel * mix(uColorHigh, uGlowColor, 0.4) * 0.65;
    color += uGlowColor * vInfluence * 1.1;
    color += fresnel * uGlowColor * vInfluence * 0.6;

    gl_FragColor = vec4(color, 1.0);
  }
`
