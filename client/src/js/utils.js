export const isNearZero = (n) => {
  return Math.abs(n) < 1e-2;
};

/**
 * Given a Vector, determine whether it isn't in motion
 */
export const isMoving = (vector3) => {
  const xMoving = !isNearZero(vector3.x);
  const yMoving = !isNearZero(vector3.y);
  const zMoving = !isNearZero(vector3.z);

  return xMoving || yMoving || zMoving;
};
