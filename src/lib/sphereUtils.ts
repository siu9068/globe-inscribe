/**
 * 구면 좌표 → 직교 좌표 변환
 * theta: 수평 각도 (0 ~ 2PI)
 * phi: 수직 각도 (0 = 북극, PI = 남극)
 */
export function sphericalToCartesian(
  radius: number,
  theta: number,
  phi: number
): { x: number; y: number; z: number } {
  return {
    x: radius * Math.sin(phi) * Math.cos(theta),
    y: radius * Math.cos(phi),
    z: radius * Math.sin(phi) * Math.sin(theta),
  }
}
